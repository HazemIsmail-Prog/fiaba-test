<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { mediaUrl, section, type GalleryItem, type WebsiteContent } from "../api.ts";

const content = inject<Ref<WebsiteContent | null>>("content");
const gallery = computed(() =>
  section<GalleryItem[]>(content?.value, "gallery", []).filter((g) => g.imageUrl || g.caption)
);
</script>

<template>
  <section class="section">
    <div class="eyebrow">Selected work</div>
    <h2>Gallery</h2>
    <p>A glimpse of ceremonies, tablescapes, and the details that shape a FIABA celebration.</p>
    <div class="gallery gallery-page">
      <div
        v-for="(item, i) in gallery"
        :key="i"
        class="gallery-item"
        :style="item.imageUrl ? { backgroundImage: `url(${mediaUrl(item.imageUrl)})` } : {}"
      >
        <span>{{ item.caption }}</span>
      </div>
    </div>
    <p v-if="!gallery.length" class="placeholder">Gallery images will appear here once published.</p>
  </section>
</template>
