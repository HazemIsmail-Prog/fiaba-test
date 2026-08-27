<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.ts";
import { errorMessage, WEBSITE_URL } from "../api.ts";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push(auth.isStaff ? "/staff/events" : "/events");
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <h1>FIABA</h1>
      <p>Sign in to view your events or manage the studio.</p>
      <p v-if="error" class="flash error">{{ error }}</p>
      <label>
        Email
        <input v-model="email" type="email" autocomplete="username" required />
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <button class="btn" :disabled="loading">{{ loading ? "Signing in…" : "Sign in" }}</button>
      <p style="margin-top: 1rem">
        <a :href="WEBSITE_URL">← Back to website</a>
      </p>
    </form>
  </div>
</template>
