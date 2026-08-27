<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage, formatDate, money } from "../../api.ts";

const events = ref<any[]>([]);
const error = ref("");

const payments = computed(() =>
  events.value.flatMap((event) =>
    (event.contracts ?? []).flatMap((contract: any) =>
      (contract.invoices ?? []).flatMap((invoice: any) =>
        (invoice.payments ?? []).map((payment: any) => ({ ...payment, invoice, event }))
      )
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
    <div class="page-head"><h1>Payments</h1></div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!payments.length" class="muted">No payments yet.</p>
    <div v-else class="row-list">
      <article v-for="p in payments" :key="p.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ p.paymentNumber }}</strong>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ p.invoice?.invoiceNumber }}</span>
            <router-link class="row-card-field" :to="`/events/${p.event.id}`">{{ p.event.title }}</router-link>
            <span class="row-card-field"><b>{{ money(p.amount) }}</b></span>
            <span class="row-card-field">{{ p.method }}</span>
            <span class="row-card-field">{{ formatDate(p.paymentDateTime) }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
