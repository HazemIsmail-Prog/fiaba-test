<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, defaultServiceImagePath, errorMessage, mediaUrl, section, type WebsiteContent, type WebsiteSection } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";

const toast = useToastStore();
const error = ref("");
const title = ref("FIABA");
const hero = ref({ description: "", imageUrl: "" });
const about = ref("");
const contact = ref({ email: "", phone: "", address: "" });
const services = ref<{ title: string; description: string; imageUrl: string }[]>([]);
const gallery = ref<{ imageUrl: string; caption: string }[]>([]);
const extra = ref<WebsiteSection[]>([]);

function toSections() {
  return [
    { key: "title", value: title.value },
    { key: "hero", value: { description: hero.value.description, imageUrl: hero.value.imageUrl } },
    { key: "about", value: about.value },
    { key: "contact", value: { ...contact.value } },
    { key: "services", value: services.value },
    { key: "gallery", value: gallery.value },
    ...extra.value,
  ];
}

function fromContent(content: WebsiteContent) {
  title.value = section(content, "title", "FIABA") || "FIABA";
  const heroSection = section<{ description?: string; imageUrl?: string }>(content, "hero", {});
  hero.value = {
    description: heroSection.description || "",
    imageUrl: heroSection.imageUrl || "",
  };
  about.value = section(content, "about", "") || "";
  contact.value = {
    ...{ email: "", phone: "", address: "" },
    ...section(content, "contact", { email: "", phone: "", address: "" }),
  };
  services.value = [...section(content, "services", [] as typeof services.value)].map((s, i) => ({
    ...s,
    imageUrl: s.imageUrl || defaultServiceImagePath(s, i),
  }));
  gallery.value = [...section(content, "gallery", [] as typeof gallery.value)];
  extra.value = (content.sections || []).filter(
    (s) => !["title", "hero", "about", "contact", "services", "gallery"].includes(s.key)
  );
}

onMounted(async () => {
  try {
    fromContent(await api<WebsiteContent>("/api/website"));
  } catch (err) {
    error.value = errorMessage(err);
  }
});

async function save() {
  error.value = "";
  try {
    const saved = await api<WebsiteContent>("/api/website", {
      method: "PUT",
      body: JSON.stringify({ sections: toSections() }),
    });
    fromContent(saved);
    toast.show("Website content saved. The public site will show these changes.");
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function upload(file: File | undefined, assign: (url: string) => void) {
  if (!file) return;
  const body = new FormData();
  body.append("file", file);
  const data = await api<{ url: string }>("/api/website/upload", { method: "POST", body });
  assign(data.url);
}

async function onFile(event: Event, assign: (url: string) => void) {
  const input = event.target as HTMLInputElement;
  await upload(input.files?.[0], assign);
}

function addService() {
  services.value.push({ title: "", description: "", imageUrl: "" });
}
function addGallery() {
  gallery.value.push({ imageUrl: "", caption: "" });
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Website content</h1>
    </div>
    <p v-if="error" class="flash error">{{ error }}</p>

    <section class="card">
      <h2>Hero</h2>
      <label>Title <input v-model="title" /></label>
      <label>Hero description <textarea v-model="hero.description" /></label>
      <label>
        Hero image
        <input type="file" accept="image/*" @change="onFile($event, (url) => (hero.imageUrl = url))" />
      </label>
      <div v-if="hero.imageUrl" class="cms-media">
        <img :src="mediaUrl(hero.imageUrl)" alt="" />
        <button class="btn ghost" type="button" @click="hero.imageUrl = ''">Remove image</button>
      </div>
    </section>

    <section class="card">
      <h2>About</h2>
      <label>About text <textarea v-model="about" /></label>
    </section>

    <section class="card">
      <h2>Contact</h2>
      <div class="row">
        <label>Email <input v-model="contact.email" /></label>
        <label>Phone <input v-model="contact.phone" /></label>
      </div>
      <label>Address <input v-model="contact.address" /></label>
    </section>

    <section class="card">
      <div class="page-head">
        <h2>Services</h2>
        <button class="btn ghost" type="button" @click="addService">Add service</button>
      </div>
      <div v-for="(s, i) in services" :key="i" class="card">
        <div class="card-head">
          <h3>{{ s.title || "Service" }}</h3>
          <button class="btn danger" type="button" @click="services.splice(i, 1)">Remove</button>
        </div>
        <label>Title <input v-model="s.title" /></label>
        <label>Description <textarea v-model="s.description" /></label>
        <label>
          Image
          <input
            type="file"
            accept="image/*"
            @change="onFile($event, (url) => (s.imageUrl = url))"
          />
        </label>
        <div v-if="s.imageUrl" class="cms-media">
          <img :src="mediaUrl(s.imageUrl)" alt="" />
          <button class="btn ghost" type="button" @click="s.imageUrl = ''">Remove image</button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="page-head">
        <h2>Gallery</h2>
        <button class="btn ghost" type="button" @click="addGallery">Add image</button>
      </div>
      <div v-for="(g, i) in gallery" :key="i" class="card">
        <div class="card-head">
          <h3>{{ g.caption || "Image" }}</h3>
          <button class="btn danger" type="button" @click="gallery.splice(i, 1)">Remove</button>
        </div>
        <label>Caption <input v-model="g.caption" /></label>
        <label>
          Image
          <input
            type="file"
            accept="image/*"
            @change="onFile($event, (url) => (g.imageUrl = url))"
          />
        </label>
        <div v-if="g.imageUrl" class="cms-media">
          <img :src="mediaUrl(g.imageUrl)" alt="" />
          <button class="btn ghost" type="button" @click="g.imageUrl = ''">Remove image</button>
        </div>
      </div>
    </section>
    <div class="cms-save-bar">
      <p class="muted">Changes apply to the public website after you save.</p>
      <button class="btn" type="button" @click="save">Save website</button>
    </div>
  </div>
</template>
