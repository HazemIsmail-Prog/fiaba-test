<script setup lang="ts">
import { computed, provide, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { APP_URL, fetchWebsite, section } from "./api.ts";
import type { ContactInfo, HeroInfo, WebsiteContent } from "./api.ts";

const route = useRoute();
const content = ref<WebsiteContent | null>(null);
const loadError = ref("");
const navOpen = ref(false);
const scrolled = ref(false);

const isHome = computed(() => route.path === "/");
const heroHasImage = computed(() =>
  Boolean(section<HeroInfo>(content.value, "hero", {}).imageUrl)
);
const overlayNav = computed(
  () => isHome.value && heroHasImage.value && !scrolled.value && !navOpen.value
);

function onScroll() {
  const y = window.scrollY;
  if (scrolled.value) {
    if (y < 8) scrolled.value = false;
  } else if (y > 40) {
    scrolled.value = true;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  try {
    content.value = await fetchWebsite();
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "Could not load site";
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("scroll", onScroll);
  document.body.style.overflow = "";
});

watch(
  () => route.fullPath,
  () => {
    navOpen.value = false;
  }
);

watch(navOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") navOpen.value = false;
}

provide("content", content);

const year = new Date().getFullYear();
const title = () => section(content.value, "title", "FIABA") || "FIABA";
const contact = () => section<ContactInfo>(content.value, "contact", {});
</script>

<template>
  <div class="page" :class="{ 'overlay-hero': isHome && heroHasImage }">
    <header class="site-header" :class="{ scrolled, overlay: overlayNav }">
      <router-link class="logo" to="/">{{ title() }}</router-link>
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="navOpen"
        aria-controls="site-nav"
        @click="navOpen = !navOpen"
      >
        {{ navOpen ? "Close" : "Menu" }}
      </button>
      <nav id="site-nav" class="nav" :class="{ open: navOpen }">
        <router-link to="/">Home</router-link>
        <router-link to="/services">Services</router-link>
        <router-link to="/gallery">Gallery</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/appointment">Appointment</router-link>
        <a :href="APP_URL">Client / staff login</a>
      </nav>
    </header>
    <div
      class="nav-backdrop"
      :class="{ open: navOpen }"
      aria-hidden="true"
      @click="navOpen = false"
    ></div>
    <main class="main">
      <p v-if="loadError" class="section flash error">{{ loadError }}</p>
      <router-view />
    </main>
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <router-link class="logo" to="/">{{ title() }}</router-link>
          <p>Bespoke weddings and celebrations, planned with care from the first conversation to the last dance.</p>
        </div>
        <div>
          <div class="eyebrow">Explore</div>
          <nav class="footer-nav">
            <router-link to="/">Home</router-link>
            <router-link to="/services">Services</router-link>
            <router-link to="/gallery">Gallery</router-link>
            <router-link to="/about">About</router-link>
            <router-link to="/appointment">Appointment</router-link>
          </nav>
        </div>
        <div>
          <div class="eyebrow">Studio</div>
          <div class="footer-contact">
            <a v-if="contact().email" :href="`mailto:${contact().email}`">{{ contact().email }}</a>
            <a v-if="contact().phone" :href="`tel:${contact().phone}`">{{ contact().phone }}</a>
            <p v-if="contact().address">{{ contact().address }}</p>
          </div>
        </div>
        <div class="footer-cta">
          <div class="eyebrow">Begin</div>
          <p>Tell us about your day and we will be in touch.</p>
          <router-link class="btn" to="/appointment">Request an appointment</router-link>
        </div>
      </div>
      <div class="footer-bar">
        <span>&copy; {{ year }} {{ title() }}</span>
        <span>Weddings &amp; events</span>
        <a :href="APP_URL">Client / staff login</a>
      </div>
    </footer>
  </div>
</template>
