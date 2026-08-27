<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, errorMessage, formatDate } from "../../api.ts";

const events = ref<any[]>([]);
const error = ref("");

onMounted(async () => {
  try {
    events.value = await api("/api/me/events");
  } catch (err) {
    error.value = errorMessage(err);
  }
});
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Your events</h1>
    </div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!events.length && !error" class="muted">No events yet.</p>
    <div v-else-if="events.length" class="row-list">
      <router-link
        v-for="event in events"
        :key="event.id"
        class="row-card"
        :to="`/events/${event.id}`"
      >
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ event.title }}</strong>
            <span class="badge" :data-status="event.status">{{ event.status }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ event.type }} · {{ event.location || "Location TBD" }}</span>
            <span class="row-card-field">{{ formatDate(event.eventDate) }}</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
