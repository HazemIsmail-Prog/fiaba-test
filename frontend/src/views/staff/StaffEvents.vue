<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage, formatDate } from "../../api.ts";
import { useAuthStore } from "../../stores/auth.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const route = useRoute();
const auth = useAuthStore();
const toast = useToastStore();
const events = ref<any[]>([]);
const clients = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const form = reactive({
  clientId: "",
  title: "",
  type: "wedding",
  status: "inquiry",
  location: "",
  eventDate: "",
});

const clientIdFilter = computed(() => {
  const id = Number(route.query.clientId);
  return Number.isInteger(id) && id > 0 ? id : null;
});

const filteredClient = computed(() =>
  clients.value.find((c) => c.id === clientIdFilter.value)
);

function defaultClientId() {
  if (clientIdFilter.value) return clientIdFilter.value;
  return clients.value[0]?.id ?? "";
}

function openCreate() {
  error.value = "";
  form.clientId = defaultClientId();
  form.title = "";
  form.type = "wedding";
  form.status = "inquiry";
  form.location = "";
  form.eventDate = "";
  showForm.value = true;
}

async function load() {
  const query = clientIdFilter.value ? `?clientId=${clientIdFilter.value}` : "";
  events.value = await api(`/api/staff/events${query}`);
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

watch(clientIdFilter, async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

async function createEvent() {
  error.value = "";
  try {
    await api("/api/staff/events", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        clientId: Number(form.clientId),
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
      }),
    });
    showForm.value = false;
    toast.show("Event created.");
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this event and its contracts, invoices, and meetings?")) return;
  error.value = "";
  try {
    await api(`/api/staff/events/${id}`, { method: "DELETE" });
    toast.show("Event deleted.");
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
        <h1>Events</h1>
        <p v-if="filteredClient" class="muted">
          {{ filteredClient.user?.name }}
          ·
          <router-link to="/staff/events">All events</router-link>
        </p>
      </div>
      <button v-if="clients.length" class="btn" type="button" @click="openCreate">New event</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!events.length" class="muted">No events yet.</p>
    <div v-else class="row-list">
      <article v-for="e in events" :key="e.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <router-link class="row-card-title" :to="`/staff/events/${e.id}`">{{ e.title }}</router-link>
            <span class="badge" :data-status="e.status">{{ e.status }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ e.client?.user?.name }}</span>
            <span class="row-card-field">{{ e.location || "—" }}</span>
            <span class="row-card-field">{{ formatDate(e.eventDate) }}</span>
          </div>
        </div>
        <div class="table-actions">
          <router-link class="btn ghost" :to="`/staff/events/${e.id}`">Edit</router-link>
          <router-link
            v-if="auth.canContracts"
            class="btn ghost"
            :to="`/staff/contracts?eventId=${e.id}`"
          >
            Contracts
          </router-link>
          <router-link
            v-if="auth.canMeetings"
            class="btn ghost"
            :to="`/staff/meetings?eventId=${e.id}`"
          >
            Meetings
          </router-link>
          <button
            v-if="auth.canUsers"
            class="btn danger"
            type="button"
            @click="remove(e.id)"
          >
            Delete
          </button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" title="New event">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="createEvent">
        <div class="row">
          <label>
            Client
            <select v-model="form.clientId" required>
              <option disabled value="">Select</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.user?.name }}
              </option>
            </select>
          </label>
          <label>Title <input v-model="form.title" required /></label>
        </div>
        <div class="row">
          <label>Type <input v-model="form.type" required /></label>
          <label>Location <input v-model="form.location" /></label>
        </div>
        <div class="row">
          <label>
            Status
            <select v-model="form.status">
              <option>inquiry</option>
              <option>planning</option>
              <option>confirmed</option>
              <option>completed</option>
              <option>cancelled</option>
            </select>
          </label>
          <label>Date <input v-model="form.eventDate" type="datetime-local" /></label>
        </div>
        <div class="modal-actions">
          <button class="btn">Create</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
