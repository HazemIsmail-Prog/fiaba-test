<script setup lang="ts">
import { reactive, ref } from "vue";
import { requestAppointment } from "../api.ts";

const form = reactive({
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  requestedAt: "",
  message: "",
});
const sending = ref(false);
const flash = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  flash.value = "";
  sending.value = true;
  try {
    await requestAppointment({
      ...form,
      requestedAt: new Date(form.requestedAt).toISOString(),
    });
    flash.value = "Thank you. We received your request and will be in touch soon.";
    form.guestName = "";
    form.guestEmail = "";
    form.guestPhone = "";
    form.requestedAt = "";
    form.message = "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not send request";
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <section class="section">
    <div class="eyebrow">Visit the studio</div>
    <h2>Request an appointment</h2>
    <p>Tell us a little about your celebration. A member of the FIABA team will confirm a time.</p>
    <p v-if="flash" class="flash">{{ flash }}</p>
    <p v-if="error" class="flash error">{{ error }}</p>
    <form class="form" @submit.prevent="submit">
      <label>
        Name
        <input v-model="form.guestName" required />
      </label>
      <label>
        Email
        <input v-model="form.guestEmail" type="email" required />
      </label>
      <label>
        Phone
        <input v-model="form.guestPhone" required />
      </label>
      <label>
        Preferred date &amp; time
        <input v-model="form.requestedAt" type="datetime-local" required />
      </label>
      <label>
        Message
        <textarea v-model="form.message" placeholder="Wedding date, venue, or anything we should know." />
      </label>
      <button class="btn btn-solid" type="submit" :disabled="sending">
        {{ sending ? "Sending…" : "Send request" }}
      </button>
    </form>
  </section>
</template>
