<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage, formatDate } from "../../api.ts";

const events = ref<any[]>([]);
const error = ref("");
const itemsMeetingId = ref<number | null>(null);

const meetings = computed(() =>
  events.value
    .flatMap((event) =>
      (event.meetings ?? []).map((meeting: any) => ({ ...meeting, event }))
    )
    .sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )
);

onMounted(async () => {
  try {
    events.value = await api("/api/me/events");
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function itemsOf(meeting: any) {
  return meeting.items ?? [];
}

function toggleItems(meeting: any) {
  itemsMeetingId.value = itemsMeetingId.value === meeting.id ? null : meeting.id;
}
</script>

<template>
  <div>
    <div class="page-head"><h1>Meetings</h1></div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!meetings.length" class="muted">No meetings yet.</p>
    <div v-else class="row-list">
      <div
        v-for="m in meetings"
        :key="m.id"
        class="row-stack"
        :class="{ 'is-open': itemsMeetingId === m.id }"
      >
        <article class="row-card">
          <div class="row-card-body">
            <div class="row-card-top">
              <strong class="row-card-title">{{ formatDate(m.scheduledAt) }}</strong>
              <span class="badge" :data-status="m.status">{{ m.status }}</span>
            </div>
            <div class="row-card-meta">
              <router-link class="row-card-field" :to="`/events/${m.event.id}`">{{ m.event.title }}</router-link>
              <span class="row-card-field">{{ itemsOf(m).length }} items</span>
            </div>
          </div>
          <div class="table-actions">
            <button
              class="btn ghost"
              type="button"
              :aria-expanded="itemsMeetingId === m.id"
              @click="toggleItems(m)"
            >
              {{ itemsMeetingId === m.id ? "Hide items" : "Items" }}
            </button>
          </div>
        </article>

        <section v-if="itemsMeetingId === m.id" class="items-panel">
          <div class="card-head">
            <h2>Items</h2>
          </div>
          <p v-if="!itemsOf(m).length" class="muted">No items yet.</p>
          <div v-else class="row-list">
            <article v-for="item in itemsOf(m)" :key="item.id" class="row-card">
              <div class="row-card-body">
                <div class="row-card-top">
                  <strong class="row-card-title">{{ item.name }}</strong>
                  <span class="badge" :data-status="item.status">{{ item.status }}</span>
                </div>
                <div class="row-card-meta">
                  <span v-if="item.category" class="row-card-field">{{ item.category }}</span>
                </div>
                <p v-if="item.notes" class="row-card-notes">{{ item.notes }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
