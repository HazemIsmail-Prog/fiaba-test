<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, errorMessage, formatDate, money, toDatetimeLocal } from "../../api.ts";
import { useAuthStore } from "../../stores/auth.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();
const event = ref<any>(null);
const error = ref("");
const formError = ref("");

const showEvent = ref(false);

const eventForm = reactive({
  title: "",
  type: "",
  location: "",
  status: "inquiry",
  eventDate: "",
});

async function load() {
  event.value = await api(`/api/staff/events/${route.params.id}`);
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function openEvent() {
  formError.value = "";
  eventForm.title = event.value.title ?? "";
  eventForm.type = event.value.type ?? "";
  eventForm.location = event.value.location ?? "";
  eventForm.status = event.value.status ?? "inquiry";
  eventForm.eventDate = toDatetimeLocal(event.value.eventDate);
  showEvent.value = true;
}

async function saveEvent() {
  formError.value = "";
  try {
    await api(`/api/staff/events/${event.value.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: eventForm.title,
        type: eventForm.type,
        status: eventForm.status,
        location: eventForm.location,
        eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : null,
      }),
    });
    showEvent.value = false;
    toast.show("Event updated.");
    await load();
  } catch (err) {
    formError.value = errorMessage(err);
  }
}

async function removeEvent() {
  if (!confirm("Delete this event and its contracts, invoices, and meetings?")) return;
  error.value = "";
  try {
    await api(`/api/staff/events/${event.value.id}`, { method: "DELETE" });
    router.push("/staff/events");
  } catch (err) {
    error.value = errorMessage(err);
  }
}
</script>

<template>
  <div v-if="event">
    <div class="page-head">
      <div>
        <router-link to="/staff/events" class="muted">← Events</router-link>
        <h1>{{ event.title }}</h1>
        <p class="muted">
          {{ event.client?.user?.name }} · {{ event.type }} · {{ formatDate(event.eventDate) }}
        </p>
      </div>
      <div class="table-actions">
        <button v-if="auth.canAppointments" class="btn" type="button" @click="openEvent">
          Edit event
        </button>
        <button v-if="auth.canUsers" class="btn danger" type="button" @click="removeEvent">
          Delete
        </button>
      </div>
    </div>
    <p v-if="error" class="flash error">{{ error }}</p>

    <section class="card">
      <p><span class="badge" :data-status="event.status">{{ event.status }}</span></p>
      <p class="muted">{{ event.location || "Location TBD" }}</p>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Contracts</h2>
        <div>
          <router-link v-if="auth.canContracts" class="btn ghost" to="/staff/contracts">
            Manage contracts
          </router-link>
          <router-link v-if="auth.canFinance" class="btn ghost" to="/staff/invoices">
            Manage invoices
          </router-link>
        </div>
      </div>
      <p v-if="!event.contracts?.length" class="muted">No contracts yet.</p>
      <div v-for="c in event.contracts" :key="c.id" class="row-list" style="margin-bottom: 1rem">
        <article class="row-card">
          <div class="row-card-body">
            <div class="row-card-top">
              <strong class="row-card-title">{{ c.contractNumber }}</strong>
              <span class="badge" :data-status="c.status">{{ c.status }}</span>
            </div>
          </div>
        </article>
        <article v-for="inv in c.invoices" :key="inv.id" class="row-card">
          <div class="row-card-body">
            <div class="row-card-top">
              <strong class="row-card-title">{{ inv.invoiceNumber }}</strong>
              <span class="badge" :data-status="inv.status">{{ inv.status }}</span>
            </div>
            <div class="row-card-meta">
              <span class="row-card-field"><b>{{ money(inv.amount) }}</b></span>
              <span class="row-card-field">paid {{ money(inv.paidAmount) }}</span>
              <span class="row-card-field">due {{ formatDate(inv.invoiceDueDate) }}</span>
            </div>
          </div>
        </article>
        <p v-if="!c.invoices?.length" class="muted">No invoices yet.</p>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Meetings</h2>
        <router-link v-if="auth.canMeetings" class="btn ghost" to="/staff/meetings">
          Manage meetings
        </router-link>
      </div>
      <p v-if="!event.meetings?.length" class="muted">No meetings yet.</p>
      <div v-for="m in event.meetings" :key="m.id" class="card">
        <div class="card-head">
          <h3>{{ formatDate(m.scheduledAt) }}</h3>
          <span class="badge" :data-status="m.status">{{ m.status }}</span>
        </div>
        <div v-for="item in m.items" :key="item.id" class="card">
          <div class="card-head">
            <h3>{{ item.name }}</h3>
            <span class="badge" :data-status="item.status">{{ item.status }}</span>
          </div>
          <p class="muted" v-if="item.category">{{ item.category }}</p>
          <p class="notes">{{ item.notes }}</p>
        </div>
        <p v-if="!m.items?.length" class="muted">No items recorded for this meeting.</p>
      </div>
    </section>

    <Modal v-model="showEvent" title="Edit event">
      <p v-if="formError" class="flash error">{{ formError }}</p>
      <form @submit.prevent="saveEvent">
        <div class="row">
          <label>Title <input v-model="eventForm.title" required /></label>
          <label>Type <input v-model="eventForm.type" required /></label>
        </div>
        <div class="row">
          <label>Location <input v-model="eventForm.location" /></label>
          <label>Date <input v-model="eventForm.eventDate" type="datetime-local" /></label>
        </div>
        <label>
          Status
          <select v-model="eventForm.status">
            <option>inquiry</option>
            <option>planning</option>
            <option>confirmed</option>
            <option>completed</option>
            <option>cancelled</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="btn">Save changes</button>
          <button class="btn ghost" type="button" @click="showEvent = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
  <p v-else-if="error" class="flash error">{{ error }}</p>
</template>
