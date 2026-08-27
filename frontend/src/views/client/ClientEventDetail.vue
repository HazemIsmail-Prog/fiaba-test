<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage, formatDate, money } from "../../api.ts";

const route = useRoute();
const event = ref<any>(null);
const error = ref("");

onMounted(async () => {
  try {
    event.value = await api(`/api/me/events/${route.params.id}`);
  } catch (err) {
    error.value = errorMessage(err);
  }
});
</script>

<template>
  <div v-if="event">
    <div class="page-head">
      <div>
        <router-link to="/events" class="muted">← Events</router-link>
        <h1>{{ event.title }}</h1>
        <p class="muted">
          {{ event.type }} · {{ event.location || "Location TBD" }} ·
          {{ formatDate(event.eventDate) }}
        </p>
      </div>
      <span class="badge" :data-status="event.status">{{ event.status }}</span>
    </div>

    <section class="card">
      <h2>Contracts</h2>
      <p v-if="!event.contracts?.length" class="muted">No contracts yet.</p>
      <div v-for="contract in event.contracts" :key="contract.id" class="row-list" style="margin-bottom: 1rem">
        <article class="row-card">
          <div class="row-card-body">
            <div class="row-card-top">
              <strong class="row-card-title">{{ contract.contractNumber }}</strong>
              <span class="badge" :data-status="contract.status">{{ contract.status }}</span>
            </div>
          </div>
        </article>
        <article v-for="inv in contract.invoices" :key="inv.id" class="row-card">
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
      </div>
    </section>

    <section class="card" v-for="meeting in event.meetings" :key="meeting.id">
      <div class="card-head">
        <h2>Meeting · {{ formatDate(meeting.scheduledAt) }}</h2>
        <span class="badge" :data-status="meeting.status">{{ meeting.status }}</span>
      </div>
      <p v-if="!meeting.items?.length" class="muted">No items recorded for this meeting.</p>
      <div v-else class="row-list">
        <article v-for="item in meeting.items" :key="item.id" class="row-card">
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
    <p v-if="!event.meetings?.length" class="muted">No meetings yet.</p>
  </div>
  <p v-else-if="error" class="flash error">{{ error }}</p>
</template>
