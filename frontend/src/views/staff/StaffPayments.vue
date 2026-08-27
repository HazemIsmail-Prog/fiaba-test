<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api, errorMessage, formatDate, money, toDatetimeLocal } from "../../api.ts";
import { useToastStore } from "../../stores/toast.ts";
import Modal from "../../components/Modal.vue";

const route = useRoute();
const toast = useToastStore();
const payments = ref<any[]>([]);
const invoices = ref<any[]>([]);
const error = ref("");
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  invoiceId: "",
  amount: "",
  method: "bank_transfer",
  paymentDateTime: "",
});

const invoiceIdFilter = computed(() => {
  const id = Number(route.query.invoiceId);
  return Number.isInteger(id) && id > 0 ? id : null;
});

const filteredInvoice = computed(() =>
  invoices.value.find((inv) => inv.id === invoiceIdFilter.value)
);

function eventClientName(event: any) {
  return event?.client?.user?.name || "";
}

const paymentRows = computed(() =>
  payments.value.map((p) => {
    const listed = invoices.value.find((inv) => inv.id === p.invoiceId || inv.id === p.invoice?.id);
    const invoice = listed || p.invoice;
    const event = invoice?.contract?.event || null;
    return {
      ...p,
      invoice,
      contract: invoice?.contract || null,
      event,
      clientName: eventClientName(event),
    };
  })
);

async function load() {
  const query = invoiceIdFilter.value ? `?invoiceId=${invoiceIdFilter.value}` : "";
  payments.value = await api(`/api/staff/payments${query}`);
  try {
    invoices.value = await api("/api/staff/invoices");
  } catch {
    invoices.value = [];
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

watch(invoiceIdFilter, async () => {
  try {
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
});

function resetForm() {
  editingId.value = null;
  form.invoiceId = invoiceIdFilter.value ?? invoices.value[0]?.id ?? "";
  form.amount = "";
  form.method = "bank_transfer";
  form.paymentDateTime = "";
}

function openCreate() {
  error.value = "";
  resetForm();
  showForm.value = true;
}

function startEdit(row: any) {
  error.value = "";
  editingId.value = row.id;
  form.invoiceId = row.invoiceId ?? row.invoice?.id ?? "";
  form.amount = String(row.amount ?? "");
  form.method = row.method ?? "bank_transfer";
  form.paymentDateTime = toDatetimeLocal(row.paymentDateTime);
  showForm.value = true;
}

async function savePayment() {
  error.value = "";
  const payload = {
    invoiceId: Number(form.invoiceId),
    amount: Number(form.amount),
    method: form.method,
    paymentDateTime: new Date(form.paymentDateTime).toISOString(),
  };
  try {
    if (editingId.value) {
      await api(`/api/staff/payments/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.show("Payment updated.");
    } else {
      await api("/api/staff/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.show("Payment recorded.");
    }
    showForm.value = false;
    resetForm();
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function remove(id: number) {
  if (!confirm("Delete this payment?")) return;
  error.value = "";
  try {
    await api(`/api/staff/payments/${id}`, { method: "DELETE" });
    toast.show("Payment deleted.");
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
        <h1>Payments</h1>
        <p v-if="filteredInvoice" class="muted">
          {{ filteredInvoice.invoiceNumber }}
          <template v-if="filteredInvoice.contract?.contractNumber">
            · {{ filteredInvoice.contract.contractNumber }}
          </template>
          <template v-if="filteredInvoice.contract?.event?.title">
            · {{ filteredInvoice.contract.event.title }}
          </template>
          <template v-if="eventClientName(filteredInvoice.contract?.event)">
            · {{ eventClientName(filteredInvoice.contract.event) }}
          </template>
          ·
          <router-link to="/staff/payments">All payments</router-link>
        </p>
      </div>
      <button v-if="invoices.length" class="btn" type="button" @click="openCreate">Record payment</button>
    </div>
    <p v-if="error && !showForm" class="flash error">{{ error }}</p>
    <p v-if="!payments.length" class="muted">No payments yet.</p>
    <div v-else class="row-list">
      <article v-for="p in paymentRows" :key="p.id" class="row-card">
        <div class="row-card-body">
          <div class="row-card-top">
            <strong class="row-card-title">{{ p.paymentNumber }}</strong>
          </div>
          <div class="row-card-meta">
            <span class="row-card-field">{{ p.invoice?.invoiceNumber }}</span>
            <span class="row-card-field">{{ p.contract?.contractNumber || "—" }}</span>
            <router-link v-if="p.event" class="row-card-field" :to="`/staff/events/${p.event.id}`">
              {{ p.event.title }}
            </router-link>
            <span v-else class="row-card-field">—</span>
            <span class="row-card-field">{{ p.clientName || "—" }}</span>
            <span class="row-card-field"><b>{{ money(p.amount) }}</b></span>
            <span class="row-card-field">{{ p.method }}</span>
            <span class="row-card-field">{{ formatDate(p.paymentDateTime) }}</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn ghost" type="button" @click="startEdit(p)">Edit</button>
          <button class="btn danger" type="button" @click="remove(p.id)">Delete</button>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" :title="editingId ? 'Edit payment' : 'Record payment'">
      <p v-if="error" class="flash error">{{ error }}</p>
      <form @submit.prevent="savePayment">
        <div class="row">
          <label>
            Invoice
            <select v-model="form.invoiceId" required>
              <option v-for="inv in invoices" :key="inv.id" :value="inv.id">
                {{ inv.invoiceNumber }}<template v-if="inv.contract?.contractNumber"> · {{ inv.contract.contractNumber }}</template><template v-if="eventClientName(inv.contract?.event)"> · {{ eventClientName(inv.contract.event) }}</template>
                · {{ money(inv.amount - inv.paidAmount) }} remaining
              </option>
            </select>
          </label>
          <label>Amount <input v-model="form.amount" type="number" step="0.001" required /></label>
        </div>
        <div class="row">
          <label>
            Method
            <select v-model="form.method">
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </label>
          <label>Paid at <input v-model="form.paymentDateTime" type="datetime-local" required /></label>
        </div>
        <div class="modal-actions">
          <button class="btn">{{ editingId ? "Save changes" : "Add payment" }}</button>
          <button class="btn ghost" type="button" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
