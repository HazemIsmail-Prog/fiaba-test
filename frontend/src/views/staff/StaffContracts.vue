<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage } from "../../api.ts";
import { useAuthStore } from "../../stores/auth.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const route = useRoute();
const auth = useAuthStore();
const toast = useToastStore();
const contracts = ref<any[]>([]);
const events = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  eventId: "",
  status: "draft",
});

const eventIdFilter = computed(() => {
  const id = Number(route.query.eventId);
  return Number.isInteger(id) && id > 0 ? id : null;
});

const filteredEvent = computed(() =>
  events.value.find((e) => e.id === eventIdFilter.value)
);

function eventClientName(event: any) {
  return event?.client?.user?.name || "";
}

function contractClientName(contract: any) {
  return (
    eventClientName(contract.event) ||
    eventClientName(
      events.value.find((e) => e.id === contract.eventId || e.id === contract.event?.id)
    ) ||
    "—"
  );
}

async function load() {
  const query = eventIdFilter.value ? `?eventId=${eventIdFilter.value}` : "";
  contracts.value = await api(`/api/staff/contracts${query}`);
  try {
    events.value = await api("/api/staff/events");
  } catch {
    events.value = [];
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

watch(eventIdFilter, async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function resetForm() {
  editingId.value = null;
  form.eventId = eventIdFilter.value ?? events.value[0]?.id ?? "";
  form.status = "draft";
}

function openCreate() {
  error.value = "";
  resetForm();
  showForm.value = true;
}

function startEdit(row: any) {
  error.value = "";
  editingId.value = row.id;
  form.eventId = row.eventId ?? row.event?.id ?? "";
  form.status = row.status ?? "draft";
  showForm.value = true;
}

async function save() {
  error.value = "";
  try {
    const payload = {
      eventId: Number(form.eventId),
      status: form.status,
    };
    if (editingId.value) {
      await api(`/api/staff/contracts/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Contract updated.");
    } else {
      await api("/api/staff/contracts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.show("Contract created.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this contract and its invoices?")) return;
  error.value = "";
  try {
    await api(`/api/staff/contracts/${id}`, { method: "DELETE" });
    toast.show("Contract deleted.");
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
      <div>
        <h1>Contracts</h1>
        <p v-if="filteredEvent" class="muted">
          {{ filteredEvent.title }}
          <template v-if="eventClientName(filteredEvent)">
            · {{ eventClientName(filteredEvent) }}
          </template>
          ·
          <router-link to="/staff/contracts">All contracts</router-link>
        </p>
      </div>
      <button v-if="auth.canUsers && events.length" class="btn" type="button" @click="openCreate">
        Add contract
      </button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!contracts.length" class="muted">No contracts yet.</p>
    <div v-else class="row-list">
      <article v-for="c in contracts" :key="c.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ c.contractNumber }}</strong>
            <span class="badge" :data-status="c.status">{{ c.status }}</span>
          </div>
          <div class="row-card-meta">
            <router-link v-if="c.event" class="row-card-field" :to="`/staff/events/${c.event.id}`">
              {{ c.event.title }}
            </router-link>
            <span class="row-card-field">{{ contractClientName(c) }}</span>
            <span class="row-card-field">{{ c.invoices?.length ?? 0 }} invoices</span>
          </div>
        </div>
        <div class="table-actions">
          <button v-if="auth.canUsers" class="btn ghost" type="button" @click="startEdit(c)">
            Edit
          </button>
          <router-link
            v-if="auth.canFinance"
            class="btn ghost"
            :to="`/staff/invoices?contractId=${c.id}`"
          >
            Invoices
          </router-link>
          <button
            v-if="auth.canUsers"
            class="btn danger"
            type="button"
            @click="remove(c.id)"
          >
            Delete
          </button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="editingId ? 'Edit contract' : 'Add contract'">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="save">
        <label>
          Event
          <select v-model="form.eventId" required>
            <option v-for="e in events" :key="e.id" :value="e.id">
              {{ e.title }}<template v-if="eventClientName(e)"> · {{ eventClientName(e) }}</template>
            </option>
          </select>
        </label>
        <label>
          Status
          <select v-model="form.status">
            <option>draft</option>
            <option>sent</option>
            <option>signed</option>
            <option>cancelled</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="btn">{{ editingId ? "Save changes" : "Create" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
