import type { Invoice, InvoiceStatus, Payment } from "@prisma/client";
import { prisma } from "../prisma.js";

type NumberedModel = "contract" | "invoice" | "payment";

export async function nextDocumentNumber(prefix: string, model: NumberedModel) {
  const year = new Date().getFullYear();
  const startsWith = `${prefix}-${year}-`;
  let lastValue: string | undefined;
  if (model === "contract") {
    const last = await prisma.contract.findFirst({
      where: { contractNumber: { startsWith } },
      orderBy: { contractNumber: "desc" },
    });
    lastValue = last?.contractNumber;
  } else if (model === "invoice") {
    const last = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith } },
      orderBy: { invoiceNumber: "desc" },
    });
    lastValue = last?.invoiceNumber;
  } else {
    const last = await prisma.payment.findFirst({
      where: { paymentNumber: { startsWith } },
      orderBy: { paymentNumber: "desc" },
    });
    lastValue = last?.paymentNumber;
  }
  let seq = 1;
  if (lastValue) {
    const n = parseInt(String(lastValue).split("-").pop() ?? "", 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${startsWith}${String(seq).padStart(4, "0")}`;
}

export function decimalToNumber(value: unknown) {
  if (value == null) return value;
  return Number(value);
}

type InvoiceWithPayments = Invoice & { payments?: Payment[] };

export function serializeInvoice<T extends InvoiceWithPayments | null | undefined>(invoice: T) {
  if (!invoice) return invoice;
  return {
    ...invoice,
    amount: decimalToNumber(invoice.amount),
    paidAmount: decimalToNumber(invoice.paidAmount),
    payments: invoice.payments?.map(serializePayment),
  };
}

export function serializePayment<T extends Payment | null | undefined>(payment: T) {
  if (!payment) return payment;
  return { ...payment, amount: decimalToNumber(payment.amount) };
}

export async function refreshInvoicePaid(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return null;
  const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amount = Number(invoice.amount);
  let status: InvoiceStatus = invoice.status;
  if (paidAmount >= amount && amount > 0) status = "paid";
  else if (paidAmount > 0) status = "partial";
  else if (
    status !== "draft" &&
    invoice.invoiceDueDate &&
    new Date(invoice.invoiceDueDate) < new Date()
  ) {
    status = "overdue";
  } else if (status === "paid" || status === "partial") {
    status = "sent";
  }
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, status },
    include: { payments: true },
  });
}
