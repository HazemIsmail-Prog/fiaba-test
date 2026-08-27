<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { section, type ContactInfo, type WebsiteContent } from "../api.ts";

const content = inject<Ref<WebsiteContent | null>>("content");
const about = computed(() => section(content?.value, "about", "") || "");
const contact = computed(() => section<ContactInfo>(content?.value, "contact", {}));
</script>

<template>
  <section class="section">
    <div class="eyebrow">The studio</div>
    <h2>About</h2>
    <p style="white-space: pre-wrap; max-width: 40rem">
      {{ about || "FIABA plans weddings and private events with close attention to materials, flowers, and atmosphere." }}
    </p>
  </section>
  <section class="section alt">
    <div class="eyebrow">Get in touch</div>
    <h2>Contact</h2>
    <p v-if="contact.email"><strong>Email</strong> {{ contact.email }}</p>
    <p v-if="contact.phone"><strong>Phone</strong> {{ contact.phone }}</p>
    <p v-if="contact.address"><strong>Studio</strong> {{ contact.address }}</p>
    <p style="margin-top: 1.5rem">
      <router-link class="btn" to="/appointment">Request an appointment</router-link>
    </p>
  </section>
</template>
