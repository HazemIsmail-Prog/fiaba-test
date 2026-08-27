<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api, errorMessage, formatDate, toDatetimeLocal } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const toast = useToastStore();
const appointments = ref<any[]>([]);
const clients = ref<any[]>([]);
const error = ref("");
const formError = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  requestedAt: "",
  message: "",
  clientId: "",
  status: "pending",
});

async function load() {
  appointments.value = await api("/api/staff/appointments");
  try {
    clients.value = await api("/api/staff/clients");
  } catch {
    clients.value = [];
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function resetForm() {
  editingId.value = null;
  form.guestName = "";
  form.guestEmail = "";
  form.guestPhone = "";
  form.requestedAt = "";
  form.message = "";
  form.clientId = "";
  form.status = "pending";
}

function openCreate() {
  formError.value = "";
  error.value = "";
  resetForm();
  showForm.value = true;
}

function startEdit(row: any) {
  formError.value = "";
  editingId.value = row.id;
  form.guestName = row.guestName ?? "";
  form.guestEmail = row.guestEmail ?? "";
  form.guestPhone = row.guestPhone ?? "";
  form.requestedAt = toDatetimeLocal(row.requestedAt);
  form.message = row.message ?? "";
  form.clientId = row.clientId || "";
  form.status = row.status ?? "pending";
  showForm.value = true;
}

async function save() {
  formError.value = "";
  const payload = {
    guestName: form.guestName,
    guestEmail: form.guestEmail,
    guestPhone: form.guestPhone,
    message: form.message,
    status: form.status,
    requestedAt: new Date(form.requestedAt).toISOString(),
    clientId: form.clientId ? Number(form.clientId) : null,
  };
  try {
    if (editingId.value) {
      await api(`/api/staff/appointments/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Appointment updated.");
    } else {
      await api("/api/staff/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.show("Appointment created.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    formError.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this appointment?")) return;
  error.value = "";
  try {
    await api(`/api/staff/appointments/${id}`, { method: "DELETE" });
    toast.show("Appointment deleted.");
    if (editingId.value === id) showForm.value = false;
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Appointments</h1>
      <button class="btn" type="button" @click="openCreate">Add appointment</button>
    </div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!appointments.length" class="muted">No appointments yet.</p>
    <div v-else class="row-list">
      <article v-for="a in appointments" :key="a.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ a.guestName }}</strong>
            <span class="badge" :data-status="a.status">{{ a.status }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ formatDate(a.requestedAt) }}</span>
            <span class="row-card-field">{{ a.guestEmail }} · {{ a.guestPhone }}</span>
            <span class="row-card-field" :title="a.message">{{ a.message || "—" }}</span>
            <span class="row-card-field">{{ a.client?.user?.name || "Guest" }}</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn ghost" type="button" @click="startEdit(a)">Edit</button>
          <button class="btn danger" type="button" @click="remove(a.id)">Delete</button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="editingId ? 'Edit appointment' : 'Add appointment'">
      <p v-if="formError" class="flash error">{{ formError }}</p>
      <form @submit.prevent="save">
        <div class="row">
          <label>Name <input v-model="form.guestName" required /></label>
          <label>Email <input v-model="form.guestEmail" type="email" required /></label>
        </div>
        <div class="row">
          <label>Phone <input v-model="form.guestPhone" required /></label>
          <label>When <input v-model="form.requestedAt" type="datetime-local" required /></label>
        </div>
        <div class="row">
          <label>
            Client
            <select v-model="form.clientId">
              <option value="">Guest (unlinked)</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.user?.name }}
              </option>
            </select>
          </label>
          <label>
            Status
            <select v-model="form.status">
              <option>pending</option>
              <option>scheduled</option>
              <option>confirmed</option>
              <option>cancelled</option>
              <option>completed</option>
            </select>
          </label>
        </div>
        <label>
          Message
          <textarea v-model="form.message" />
        </label>
        <div class="modal-actions">
          <button class="btn">{{ editingId ? "Save changes" : "Create" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
