<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, errorMessage } from "../../api.ts";

const events = ref<any[]>([]);
const error = ref("");

const contracts = computed(() =>
  events.value.flatMap((event) =>
    (event.contracts ?? []).map((contract: any) => ({ ...contract, event }))
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
    <div class="page-head"><h1>Contracts</h1></div>
    <p v-if="error" class="flash error">{{ error }}</p>
    <p v-if="!contracts.length" class="muted">No contracts yet.</p>
    <div v-else class="row-list">
      <article v-for="c in contracts" :key="c.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ c.contractNumber }}</strong>
            <span class="badge" :data-status="c.status">{{ c.status }}</span>
          </div>
          <div class="row-card-meta">
            <router-link class="row-card-field" :to="`/events/${c.event.id}`">{{ c.event.title }}</router-link>
            <span class="row-card-field">{{ c.invoices?.length ?? 0 }} invoices</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
