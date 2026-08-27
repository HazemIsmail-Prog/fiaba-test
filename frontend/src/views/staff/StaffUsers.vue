<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api, errorMessage } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const toast = useToastStore();
const users = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "secretary",
});

const isEditing = computed(() => editingId.value != null);

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.email = "";
  form.password = "";
  form.role = "secretary";
}

function openCreate() {
  resetForm();
  error.value = "";
  showForm.value = true;
}

async function load() {
  users.value = await api("/api/staff/users");
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function startEdit(user: any) {
  error.value = "";
  editingId.value = user.id;
  form.name = user.name ?? "";
  form.email = user.email ?? "";
  form.password = "";
  form.role = user.role ?? "secretary";
  showForm.value = true;
}

async function saveUser() {
  error.value = "";
  try {
    if (isEditing.value) {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) payload.password = form.password;
      await api(`/api/staff/users/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("User updated.");
    } else {
      await api("/api/staff/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.show("User created.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this user?")) return;
  await api(`/api/staff/users/${id}`, { method: "DELETE" });
  if (editingId.value === id) {
    showForm.value = false;
    resetForm();
  }
  await load();
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Users</h1>
      <button class="btn" type="button" @click="openCreate">Add user</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!users.length" class="muted">No users yet.</p>
    <div v-else class="row-list">
      <article v-for="u in users" :key="u.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ u.name }}</strong>
            <span class="badge" :data-status="u.role">{{ u.role }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ u.email }}</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn ghost" type="button" @click="startEdit(u)">Edit</button>
          <button class="btn danger" type="button" @click="remove(u.id)">Delete</button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="isEditing ? 'Edit user' : 'Add user'">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="saveUser">
        <div class="row">
          <label>Name <input v-model="form.name" required /></label>
          <label>Email <input v-model="form.email" type="email" required /></label>
        </div>
        <div class="row">
          <label>
            Password
            <input
              v-model="form.password"
              :required="!isEditing"
              :placeholder="isEditing ? 'Leave blank to keep current' : ''"
            />
          </label>
          <label>
            Role
            <select v-model="form.role">
              <option>admin</option>
              <option>manager</option>
              <option>accountant</option>
              <option>secretary</option>
              <option>client</option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn">{{ isEditing ? "Save changes" : "Create" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
