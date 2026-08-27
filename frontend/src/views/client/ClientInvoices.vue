<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage, formatDate, money } from "../../api.ts";

const events = ref<any[]>([]);
const error = ref("");

const invoices = computed(() =>
  events.value.flatMap((event) =>
    (event.contracts ?? []).flatMap((contract: any) =>
      (contract.invoices ?? []).map((invoice: any) => ({ ...invoice, event, contract }))
    )
  )
);

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
    <div class="page-head"><h1>Invoices</h1></div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!invoices.length" class="muted">No invoices yet.</p>
    <div v-else class="row-list">
      <article v-for="inv in invoices" :key="inv.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ inv.invoiceNumber }}</strong>
            <span class="badge" :data-status="inv.status">{{ inv.status }}</span>
          </div>
          <div class="row-card-meta">
            <router-link class="row-card-field" :to="`/events/${inv.event.id}`">{{ inv.event.title }}</router-link>
            <span class="row-card-field"><b>{{ money(inv.amount) }}</b></span>
            <span class="row-card-field">paid {{ money(inv.paidAmount) }}</span>
            <span class="row-card-field">due {{ formatDate(inv.invoiceDueDate) }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
