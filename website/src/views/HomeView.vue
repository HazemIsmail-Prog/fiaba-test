<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { mediaUrl, section, serviceImageUrl, type GalleryItem, type HeroInfo, type ServiceItem, type WebsiteContent } from "../api.ts";

const content = inject<Ref<WebsiteContent | null>>("content");
const title = computed(() => section(content?.value, "title", "FIABA") || "FIABA");
const hero = computed(() => section<HeroInfo>(content?.value, "hero", {}));
const services = computed(() => section<ServiceItem[]>(content?.value, "services", []));
const gallery = computed(() =>
  section<GalleryItem[]>(content?.value, "gallery", []).filter((g) => g.imageUrl || g.caption)
);
const previewGallery = computed(() => gallery.value.slice(0, 3));
</script>

<template>
  <section
    class="hero"
    :class="{ 'has-image': Boolean(hero.imageUrl) }"
    :style="hero.imageUrl ? { backgroundImage: `url(${mediaUrl(hero.imageUrl)})` } : {}"
  >
    <div class="hero-inner">
      <div class="eyebrow">Weddings &amp; events</div>
      <h1>{{ title }}</h1>
      <p>{{ hero.description || "Bespoke celebrations, planned with care." }}</p>
      <router-link class="btn" to="/appointment">Request an appointment</router-link>
    </div>
  </section>

  <section class="section alt">
    <div class="eyebrow">What we do</div>
    <h2>Services</h2>
    <div class="cards">
      <article v-for="(item, i) in services" :key="i" class="card">
        <img :src="serviceImageUrl(item, i)" :alt="item.title" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    </div>
    <p v-if="!services.length" class="placeholder">Services will appear here once published.</p>
    <p style="margin-top: 2rem">
      <router-link class="btn" to="/services">View all services</router-link>
    </p>
  </section>

  <section class="section" v-if="previewGallery.length">
    <div class="eyebrow">Selected work</div>
    <h2>Gallery</h2>
    <div class="gallery">
      <div
        v-for="(item, i) in previewGallery"
        :key="i"
        class="gallery-item"
        :style="item.imageUrl ? { backgroundImage: `url(${mediaUrl(item.imageUrl)})` } : {}"
      >
        <span>{{ item.caption }}</span>
      </div>
    </div>
    <p style="margin-top: 2rem">
      <router-link class="btn" to="/gallery">View gallery</router-link>
    </p>
  </section>
</template>
