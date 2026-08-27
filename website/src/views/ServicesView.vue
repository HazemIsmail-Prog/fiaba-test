<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { section, serviceImageUrl, type ServiceItem, type WebsiteContent } from "../api.ts";

const content = inject<Ref<WebsiteContent | null>>("content");
const services = computed(() => section<ServiceItem[]>(content?.value, "services", []));
</script>

<template>
  <section class="section">
    <div class="eyebrow">Offerings</div>
    <h2>Services</h2>
    <p>From full wedding planning to styling and florals, each event is designed around you.</p>
    <div class="cards">
      <article v-for="(item, i) in services" :key="i" class="card">
        <img :src="serviceImageUrl(item, i)" :alt="item.title" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    </div>
    <p v-if="!services.length" class="placeholder">No services published yet.</p>
  </section>
</template>
