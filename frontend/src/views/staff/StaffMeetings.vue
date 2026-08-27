<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage, formatDate, toDatetimeLocal } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";
import MeetingItemForm from "../../components/MeetingItemForm.vue";

const CATEGORIES = ["flowers", "materials", "extra"];

const route = useRoute();
const toast = useToastStore();
const meetings = ref<any[]>([]);
const events = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  eventId: "",
  scheduledAt: "",
  status: "scheduled",
});

const itemsMeetingId = ref<number | null>(null);
const showItemEditor = ref(false);
const editingItemId = ref<number | null>(null);
const itemError = ref("");
const itemForm = reactive({
  name: "",
  category: "flowers",
  status: "pending",
  notes: "",
});

const eventIdFilter = computed(() => {
  const id = Number(route.query.eventId);
  return Number.isInteger(id) && id > 0 ? id : null;
});

const filteredEvent = computed(() =>
  events.value.find((e) => e.id === eventIdFilter.value)
);

const openMeeting = computed(() =>
  meetings.value.find((m) => m.id === itemsMeetingId.value)
);

const openItems = computed(() => openMeeting.value?.items ?? []);

const categoryOptions = computed(() => {
  const current = itemForm.category.trim();
  if (current && !CATEGORIES.includes(current)) return [...CATEGORIES, current];
  return CATEGORIES;
});

function eventClientName(event: any) {
  return event?.client?.user?.name || "";
}

function meetingClientName(meeting: any) {
  return (
    eventClientName(meeting.event) ||
    eventClientName(
      events.value.find((e) => e.id === meeting.eventId || e.id === meeting.event?.id)
    ) ||
    "—"
  );
}

function itemsCount(meeting: any) {
  return meeting.items?.length ?? 0;
}

async function load() {
  const query = eventIdFilter.value ? `?eventId=${eventIdFilter.value}` : "";
  meetings.value = await api(`/api/staff/meetings${query}`);
  try {
    events.value = await api("/api/staff/events");
  } catch {
    events.value = [];
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

watch(eventIdFilter, async () => {
  itemsMeetingId.value = null;
  resetItemEditor();
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

watch(showItemEditor, (open) => {
  if (!open) {
    editingItemId.value = null;
    itemError.value = "";
  }
});

function resetItemEditor() {
  showItemEditor.value = false;
  editingItemId.value = null;
  itemError.value = "";
  itemForm.name = "";
  itemForm.category = "flowers";
  itemForm.status = "pending";
  itemForm.notes = "";
}

function resetForm() {
  editingId.value = null;
  form.eventId = eventIdFilter.value ?? events.value[0]?.id ?? "";
  form.scheduledAt = "";
  form.status = "scheduled";
}

function openCreate() {
  error.value = "";
  resetForm();
  showForm.value = true;
}

function startEdit(row: any) {
  error.value = "";
  editingId.value = row.id;
  form.eventId = row.eventId ?? row.event?.id ?? "";
  form.scheduledAt = toDatetimeLocal(row.scheduledAt);
  form.status = row.status ?? "scheduled";
  showForm.value = true;
}

async function revealItems(meetingId: number, add = false) {
  itemsMeetingId.value = meetingId;
  resetItemEditor();
  if (add) openAddItem();
  await nextTick();
  document
    .getElementById(`meeting-items-${meetingId}`)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function toggleItems(meeting: any) {
  if (itemsMeetingId.value === meeting.id) {
    itemsMeetingId.value = null;
    resetItemEditor();
    return;
  }
  void revealItems(meeting.id);
}

async function saveMeeting() {
  error.value = "";
  try {
    const payload = {
      eventId: Number(form.eventId),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      status: form.status,
    };
    if (editingId.value) {
      await api(`/api/staff/meetings/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showForm.value = false;
      resetForm();
      await load();
      toast.show("Meeting updated.");
    } else {
      const created = await api<any>("/api/staff/meetings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showForm.value = false;
      resetForm();
      await load();
      toast.show("Meeting created.");
      await revealItems(created.id, true);
    }
  } catch (err) {
    error.value = errorMessage(err);
  }
}

function openAddItem() {
  itemError.value = "";
  editingItemId.value = null;
  itemForm.name = "";
  itemForm.category = "flowers";
  itemForm.status = "pending";
  itemForm.notes = "";
  showItemEditor.value = true;
}

function openEditItem(item: any) {
  itemError.value = "";
  editingItemId.value = item.id;
  itemForm.name = item.name ?? "";
  itemForm.category = item.category || "flowers";
  itemForm.status = item.status ?? "pending";
  itemForm.notes = item.notes ?? "";
  showItemEditor.value = true;
}

async function saveItem() {
  if (!itemsMeetingId.value) return;
  itemError.value = "";
  try {
    const payload = {
      name: itemForm.name,
      category: itemForm.category,
      notes: itemForm.notes,
      status: itemForm.status,
    };
    if (editingItemId.value) {
      await api(`/api/staff/meeting-items/${editingItemId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Item saved.");
    } else {
      await api("/api/staff/meeting-items", {
        method: "POST",
        body: JSON.stringify({ ...payload, meetingId: itemsMeetingId.value }),
      });
      toast.show("Item added.");
    }
    resetItemEditor();
    await load();
  } catch (err) {
    itemError.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this meeting and its items?")) return;
  error.value = "";
  try {
    await api(`/api/staff/meetings/${id}`, { method: "DELETE" });
    toast.show("Meeting deleted.");
    if (editingId.value === id) {
      showForm.value = false;
      resetForm();
    }
    if (itemsMeetingId.value === id) {
      itemsMeetingId.value = null;
      resetItemEditor();
    }
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function removeItem(id: number) {
  if (!confirm("Delete this meeting item?")) return;
  itemError.value = "";
  try {
    await api(`/api/staff/meeting-items/${id}`, { method: "DELETE" });
    toast.show("Item deleted.");
    if (editingItemId.value === id) resetItemEditor();
    await load();
  } catch (err) {
    itemError.value = errorMessage(err);
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Meetings</h1>
        <p v-if="filteredEvent" class="muted">
          {{ filteredEvent.title }}
          <template v-if="eventClientName(filteredEvent)">
            · {{ eventClientName(filteredEvent) }}
          </template>
          ·
          <router-link to="/staff/meetings">All meetings</router-link>
        </p>
      </div>
      <button v-if="events.length" class="btn" type="button" @click="openCreate">Add meeting</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!meetings.length" class="muted">No meetings yet.</p>
    <div v-else class="row-list">
      <div
        v-for="m in meetings"
        :key="m.id"
        class="row-stack"
        :class="{ 'is-open': itemsMeetingId === m.id }"
      >
        <article class="row-card">
          <div class="row-card-body">
            <div class="row-card-top">
              <strong class="row-card-title">{{ formatDate(m.scheduledAt) }}</strong>
              <span class="badge" :data-status="m.status">{{ m.status }}</span>
            </div>
            <div class="row-card-meta">
              <router-link v-if="m.event" class="row-card-field" :to="`/staff/events/${m.event.id}`">
                {{ m.event.title }}
              </router-link>
              <span class="row-card-field">{{ meetingClientName(m) }}</span>
              <span class="row-card-field">{{ itemsCount(m) }} items</span>
            </div>
          </div>
          <div class="table-actions">
            <button
              class="btn ghost"
              type="button"
              :aria-expanded="itemsMeetingId === m.id"
              @click="toggleItems(m)"
            >
              {{ itemsMeetingId === m.id ? "Hide items" : "Items" }}
            </button>
            <button class="btn ghost" type="button" @click="startEdit(m)">Edit</button>
            <button class="btn danger" type="button" @click="remove(m.id)">Delete</button>
          </div>
        </article>

        <section
          v-if="itemsMeetingId === m.id"
          :id="`meeting-items-${m.id}`"
          class="items-panel"
        >
          <div class="card-head">
            <h2>Items</h2>
            <button class="btn" type="button" @click="openAddItem">Add item</button>
          </div>
          <p v-if="!openItems.length" class="muted">No items yet.</p>
          <div v-else class="row-list">
            <article v-for="item in openItems" :key="item.id" class="row-card">
              <div class="row-card-body">
                <div class="row-card-top">
                  <strong class="row-card-title">{{ item.name }}</strong>
                  <span class="badge" :data-status="item.status">{{ item.status }}</span>
                </div>
                <div class="row-card-meta">
                  <span v-if="item.category" class="row-card-field">{{ item.category }}</span>
                </div>
                <p v-if="item.notes" class="row-card-notes">{{ item.notes }}</p>
              </div>
              <div class="table-actions">
                <button class="btn ghost" type="button" @click="openEditItem(item)">Edit</button>
                <button class="btn danger" type="button" @click="removeItem(item.id)">Delete</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <Modal v-model="showItemEditor" :title="editingItemId ? 'Edit item' : 'Add item'">
      <p v-if="itemError" class="flash error">{{ itemError }}</p>
      <MeetingItemForm
        :form="itemForm"
        :submit-label="editingItemId ? 'Save item' : 'Add item'"
        :categories="categoryOptions"
        @save="saveItem"
        @cancel="resetItemEditor"
      />
    </Modal>

    <Modal v-model="showForm" :title="editingId ? 'Edit meeting' : 'Add meeting'">
      <p v-if="error && showForm" class="flash error">{{ error }}</p>
      <form @submit.prevent="saveMeeting">
        <div class="row">
          <label>
            Event
            <select v-model="form.eventId" required>
              <option v-for="e in events" :key="e.id" :value="e.id">
                {{ e.title }}<template v-if="eventClientName(e)"> · {{ eventClientName(e) }}</template>
              </option>
            </select>
          </label>
          <label>When <input v-model="form.scheduledAt" type="datetime-local" required /></label>
        </div>
        <label>
          Status
          <select v-model="form.status">
            <option>scheduled</option>
            <option>completed</option>
            <option>cancelled</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="btn">{{ editingId ? "Save meeting" : "Create meeting" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
