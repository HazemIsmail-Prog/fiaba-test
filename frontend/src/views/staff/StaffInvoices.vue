<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage, formatDate, money, toDatetimeLocal } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const route = useRoute();
const toast = useToastStore();
const invoices = ref<any[]>([]);
const contracts = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  contractId: "",
  amount: "",
  invoiceDateTime: "",
  invoiceDueDate: "",
  status: "draft",
});

const contractIdFilter = computed(() => {
  const id = Number(route.query.contractId);
  return Number.isInteger(id) && id > 0 ? id : null;
});

const filteredContract = computed(() =>
  contracts.value.find((c) => c.id === contractIdFilter.value)
);

function eventClientName(event: any) {
  return event?.client?.user?.name || "";
}

const invoiceRows = computed(() =>
  invoices.value.map((inv) => {
    const event =
      inv.contract?.event ||
      contracts.value.find((c) => c.id === inv.contractId || c.id === inv.contract?.id)?.event ||
      null;
    return { ...inv, event, clientName: eventClientName(event) };
  })
);

async function load() {
  const query = contractIdFilter.value ? `?contractId=${contractIdFilter.value}` : "";
  invoices.value = await api(`/api/staff/invoices${query}`);
  try {
    contracts.value = await api("/api/staff/contracts");
  } catch {
    contracts.value = [];
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

watch(contractIdFilter, async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function resetForm() {
  editingId.value = null;
  form.contractId = contractIdFilter.value ?? contracts.value[0]?.id ?? "";
  form.amount = "";
  form.invoiceDateTime = "";
  form.invoiceDueDate = "";
  form.status = "draft";
}

function openCreate() {
  error.value = "";
  resetForm();
  showForm.value = true;
}

function startEdit(row: any) {
  error.value = "";
  editingId.value = row.id;
  form.contractId = row.contractId ?? row.contract?.id ?? "";
  form.amount = String(row.amount ?? "");
  form.invoiceDateTime = toDatetimeLocal(row.invoiceDateTime);
  form.invoiceDueDate = toDatetimeLocal(row.invoiceDueDate);
  form.status = row.status ?? "draft";
  showForm.value = true;
}

async function saveInvoice() {
  error.value = "";
  const payload = {
    contractId: Number(form.contractId),
    amount: Number(form.amount),
    status: form.status,
    invoiceDateTime: new Date(form.invoiceDateTime).toISOString(),
    invoiceDueDate: new Date(form.invoiceDueDate).toISOString(),
  };
  try {
    if (editingId.value) {
      await api(`/api/staff/invoices/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Invoice updated.");
    } else {
      await api("/api/staff/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.show("Invoice created.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this invoice and its payments?")) return;
  error.value = "";
  try {
    await api(`/api/staff/invoices/${id}`, { method: "DELETE" });
    toast.show("Invoice deleted.");
    if (editingId.value === id) showForm.value = false;
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Invoices</h1>
        <p v-if="filteredContract" class="muted">
          {{ filteredContract.contractNumber }}
          <template v-if="filteredContract.event?.title">
            · {{ filteredContract.event.title }}
          </template>
          <template v-if="eventClientName(filteredContract.event)">
            · {{ eventClientName(filteredContract.event) }}
          </template>
          ·
          <router-link to="/staff/invoices">All invoices</router-link>
        </p>
      </div>
      <button v-if="contracts.length" class="btn" type="button" @click="openCreate">Add invoice</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!invoices.length" class="muted">No invoices yet.</p>
    <div v-else class="row-list">
      <article v-for="inv in invoiceRows" :key="inv.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ inv.invoiceNumber }}</strong>
            <span class="badge" :data-status="inv.status">{{ inv.status }}</span>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ inv.contract?.contractNumber }}</span>
            <router-link v-if="inv.event" class="row-card-field" :to="`/staff/events/${inv.event.id}`">
              {{ inv.event.title }}
            </router-link>
            <span v-else class="row-card-field">—</span>
            <span class="row-card-field">{{ inv.clientName || "—" }}</span>
            <span class="row-card-field"><b>{{ money(inv.amount) }}</b></span>
            <span class="row-card-field">paid {{ money(inv.paidAmount) }}</span>
            <span class="row-card-field">due {{ formatDate(inv.invoiceDueDate) }}</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn ghost" type="button" @click="startEdit(inv)">Edit</button>
          <router-link class="btn ghost" :to="`/staff/payments?invoiceId=${inv.id}`">
            Payments
          </router-link>
          <button class="btn danger" type="button" @click="remove(inv.id)">Delete</button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="editingId ? 'Edit invoice' : 'Add invoice'">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="saveInvoice">
        <div class="row">
          <label>
            Contract
            <select v-model="form.contractId" required>
              <option v-for="c in contracts" :key="c.id" :value="c.id">
                {{ c.contractNumber }}<template v-if="c.event?.title"> · {{ c.event.title }}</template><template v-if="eventClientName(c.event)"> · {{ eventClientName(c.event) }}</template>
              </option>
            </select>
          </label>
          <label>Amount <input v-model="form.amount" type="number" step="0.001" required /></label>
        </div>
        <div class="row">
          <label>Invoice date <input v-model="form.invoiceDateTime" type="datetime-local" required /></label>
          <label>Due date <input v-model="form.invoiceDueDate" type="datetime-local" required /></label>
        </div>
        <label>
          Status
          <select v-model="form.status">
            <option>draft</option>
            <option>sent</option>
            <option>partial</option>
            <option>paid</option>
            <option>overdue</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="btn">{{ editingId ? "Save changes" : "Create" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
