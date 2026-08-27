<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

const open = defineModel<boolean>({ default: false });
defineProps<{ title: string; wide?: boolean }>();

function close() {
  open.value = false;
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) close();
}

watch(open, (value) => {
  document.body.style.overflow = value ? "hidden" : "";
});

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal" :class="{ wide }" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2>{{ title }}</h2>
          <button class="btn ghost" type="button" @click="close">Close</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
