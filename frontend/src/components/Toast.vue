<script setup lang="ts">
import { useToastStore } from "../stores/toast.ts";

const toast = useToastStore();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="toast.message"
      class="toast"
      :class="{ error: toast.kind === 'error' }"
      role="status"
      @click="toast.dismiss()"
    >
      {{ toast.message }}
    </div>
  </Teleport>
</template>
