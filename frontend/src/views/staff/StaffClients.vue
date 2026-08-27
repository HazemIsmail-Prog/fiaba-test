<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api, errorMessage } from "../../api.ts";
import { useAuthStore } from "../../stores/auth.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const auth = useAuthStore();
const toast = useToastStore();
const clients = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  notes: "",
});

const isEditing = computed(() => editingId.value != null);

function resetForm() {
  editingId.value = null;
  Object.assign(form, {
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    notes: "",
  });
}

function openCreate() {
  resetForm();
  error.value = "";
  showForm.value = true;
}

async function load() {
  clients.value = await api("/api/staff/clients");
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function startEdit(client: any) {
  error.value = "";
  editingId.value = client.id;
  form.name = client.user?.name ?? "";
  form.email = client.user?.email ?? "";
  form.password = "";
  form.phone = client.phone ?? "";
  form.address = client.address ?? "";
  form.notes = client.notes ?? "";
  showForm.value = true;
}

async function saveClient() {
  error.value = "";
  try {
    if (isEditing.value) {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
      };
      if (form.password) payload.password = form.password;
      await api(`/api/staff/clients/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Client updated.");
    } else {
      await api("/api/staff/clients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.show("Client created.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this client and their events?")) return;
  await api(`/api/staff/clients/${id}`, { method: "DELETE" });
  if (editingId.value === id) {
    showForm.value = false;
    resetForm();
  }
  await load();
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Clients</h1>
      <button class="btn" type="button" @click="openCreate">Add client</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!clients.length" class="muted">No clients yet.</p>
    <div v-else class="row-list">
      <article v-for="c in clients" :key="c.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ c.user?.name }}</strong>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ c.user?.email }}</span>
            <span class="row-card-field">{{ c.phone || "—" }}</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn ghost" type="button" @click="startEdit(c)">Edit</button>
          <router-link class="btn ghost" :to="`/staff/events?clientId=${c.id}`">Events</router-link>
          <button v-if="auth.canUsers" class="btn danger" type="button" @click="remove(c.id)">
            Delete
          </button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="isEditing ? 'Edit client' : 'Add client'">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="saveClient">
        <div class="row">
          <label>Name <input v-model="form.name" required /></label>
          <label>Email <input v-model="form.email" type="email" required /></label>
        </div>
        <div class="row">
          <label>
            Password
            <input
              v-model="form.password"
              :required="!isEditing"
              :placeholder="isEditing ? 'Leave blank to keep current' : ''"
            />
          </label>
          <label>Phone <input v-model="form.phone" /></label>
        </div>
        <label>Address <input v-model="form.address" /></label>
        <label>Notes <textarea v-model="form.notes" /></label>
        <div class="modal-actions">
          <button class="btn">{{ isEditing ? "Save changes" : "Create" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
