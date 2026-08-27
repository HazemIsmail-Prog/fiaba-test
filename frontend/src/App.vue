<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth.ts";
import Toast from "./components/Toast.vue";
import { WEBSITE_URL } from "./api.ts";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const showShell = computed(() => route.name !== "login" && auth.isLoggedIn);
const menuOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);

function logout() {
  menuOpen.value = false;
  auth.logout();
  router.push("/login");
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") menuOpen.value = false;
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div v-if="!showShell" class="auth-shell">
    <router-view />
  </div>
  <div v-else class="shell" :class="{ 'menu-open': menuOpen }">
    <header class="topbar">
      <div class="brand">FIABA</div>
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="app-sidebar"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? "Close" : "Menu" }}
      </button>
    </header>
    <div class="sidebar-backdrop" aria-hidden="true" @click="menuOpen = false"></div>
    <aside id="app-sidebar" class="sidebar">
      <div class="brand">FIABA</div>
      <template v-if="!auth.isStaff">
        <router-link to="/events">Events</router-link>
        <router-link to="/appointments">Appointments</router-link>
        <router-link to="/meetings">Meetings</router-link>
        <router-link to="/contracts">Contracts</router-link>
        <router-link to="/invoices">Invoices</router-link>
        <router-link to="/payments">Payments</router-link>
      </template>
      <template v-else>
        <router-link v-if="auth.canClients" to="/staff/clients">Clients</router-link>
        <router-link v-if="auth.canEvents" to="/staff/events">Events</router-link>
        <router-link v-if="auth.canAppointments" to="/staff/appointments">Appointments</router-link>
        <router-link v-if="auth.canMeetings" to="/staff/meetings">Meetings</router-link>
        <router-link v-if="auth.canContracts" to="/staff/contracts">Contracts</router-link>
        <router-link v-if="auth.canFinance" to="/staff/invoices">Invoices</router-link>
        <router-link v-if="auth.canFinance" to="/staff/payments">Payments</router-link>
        <router-link v-if="auth.canUsers" to="/staff/users">Users</router-link>
        <router-link v-if="auth.canCms" to="/staff/website">Website</router-link>
      </template>
      <div class="grow"></div>
      <a :href="WEBSITE_URL" target="_blank" rel="noopener">View website</a>
      <div class="who">{{ auth.user?.name }} · {{ auth.role }}</div>
      <button class="link" type="button" @click="logout">Log out</button>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
  <Toast />
</template>
