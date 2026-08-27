<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api, errorMessage, formatDate } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const toast = useToastStore();
const appointments = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const form = reactive({ requestedAt: "", message: "", guestPhone: "" });

async function load() {
  appointments.value = await api("/api/me/appointments");
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function openCreate() {
  error.value = "";
  form.requestedAt = "";
  form.message = "";
  form.guestPhone = "";
  showForm.value = true;
}

async function submit() {
  error.value = "";
  try {
    await api("/api/me/appointments", {
      method: "POST",
      body: JSON.stringify({
        requestedAt: new Date(form.requestedAt).toISOString(),
        message: form.message,
        guestPhone: form.guestPhone,
      }),
    });
    showForm.value = false;
    toast.show("Appointment requested.");
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
      <button class="btn" type="button" @click="openCreate">Request appointment</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>

    <p v-if="!appointments.length" class="muted">No appointments yet.</p>
    <div v-else class="row-list">
      <article v-for="a in appointments" :key="a.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ formatDate(a.requestedAt) }}</strong>
            <span class="badge" :data-status="a.status">{{ a.status }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field" :title="a.message">{{ a.message || "—" }}</span>
          </div>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" title="Request an appointment">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="submit">
        <div class="row">
          <label>
            Preferred date &amp; time
            <input v-model="form.requestedAt" type="datetime-local" required />
          </label>
          <label>
            Phone
            <input v-model="form.guestPhone" />
          </label>
        </div>
        <label>
          Message
          <textarea v-model="form.message" />
        </label>
        <div class="modal-actions">
          <button class="btn">Send request</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
