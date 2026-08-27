<script setup lang="ts">
defineProps<{
  form: {
    name: string;
    category: string;
    status: string;
    notes: string;
  };
  submitLabel: string;
  categories: string[];
}>();

const emit = defineEmits<{
  save: [];
  cancel: [];
}>();
</script>

<template>
  <form @submit.prevent="emit('save')">
    <div class="row">
      <label>Name <input v-model="form.name" required /></label>
      <label>
        Category
        <select v-model="form.category">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </label>
    </div>
    <label>
      Status
      <select v-model="form.status">
        <option>pending</option>
        <option>approved</option>
        <option>rejected</option>
        <option>in_progress</option>
      </select>
    </label>
    <label>
      Notes
      <textarea v-model="form.notes" placeholder="Materials, flowers, extras…" />
    </label>
    <div class="modal-actions">
      <button class="btn">{{ submitLabel }}</button>
      <button class="btn ghost" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
