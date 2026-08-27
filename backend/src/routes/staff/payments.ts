import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";
import {
  nextDocumentNumber,
  refreshInvoicePaid,
  serializeInvoice,
  serializePayment,
} from "../../utils/money.js";

export const paymentsRouter = Router();
const canManage = requireRole("admin", "manager", "accountant");

const paymentInclude = {
  invoice: {
    include: {
      contract: { include: { event: { include: { client: { include: { user: true } } } } } },
    },
  },
} satisfies Prisma.PaymentInclude;

function serializeUser(user: { id: number; email: string; name: string; role: string } | null | undefined) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function serializeListedPayment(payment: Parameters<typeof serializePayment>[0] & {
  invoice?: {
    id: number;
    invoiceNumber: string;
    contractId: number;
    amount: unknown;
    paidAmount: unknown;
    status: string;
    contract?: {
      id: number;
      contractNumber: string;
      eventId: number;
      event?: {
        id: number;
        title: string;
        clientId: number;
        client?: {
          id: number;
          user?: { id: number; email: string; name: string; role: string } | null;
        } | null;
      } | null;
    } | null;
  } | null;
}) {
  const base = serializePayment(payment);
  if (!base) return base;
  const invoice = payment.invoice;
  const contract = invoice?.contract;
  const event = contract?.event;
  return {
    ...base,
    invoice: invoice
      ? {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          contractId: invoice.contractId,
          amount: Number(invoice.amount),
          paidAmount: Number(invoice.paidAmount),
          status: invoice.status,
          contract: contract
            ? {
                id: contract.id,
                contractNumber: contract.contractNumber,
                eventId: contract.eventId,
                event: event
                  ? {
                      id: event.id,
                      title: event.title,
                      clientId: event.clientId,
                      client: event.client
                        ? { id: event.client.id, user: serializeUser(event.client.user) }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      : invoice,
  };
}

paymentsRouter.get("/", canManage, async (req, res) => {
  const where = req.query.invoiceId ? { invoiceId: Number(req.query.invoiceId) } : {};
  const payments = await prisma.payment.findMany({
    where,
    include: paymentInclude,
    orderBy: { id: "desc" },
  });
  res.json(payments.map(serializeListedPayment));
});

paymentsRouter.get("/:id", canManage, async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: Number(req.params.id) },
    include: paymentInclude,
  });
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(serializeListedPayment(payment));
});

paymentsRouter.post("/", canManage, async (req, res) => {
  const { invoiceId, amount, method, paymentDateTime } = req.body ?? {};
  if (!invoiceId || amount == null || !method || !paymentDateTime) {
    res.status(400).json({
      error: "invoiceId, amount, method, and paymentDateTime are required",
    });
    return;
  }
  const paymentNumber = await nextDocumentNumber("PAY", "payment");
  const payment = await prisma.payment.create({
    data: {
      invoiceId: Number(invoiceId),
      paymentNumber,
      amount: Number(amount),
      method: String(method).trim(),
      paymentDateTime: new Date(paymentDateTime),
    },
  });
  const invoice = await refreshInvoicePaid(payment.invoiceId);
  res.status(201).json({
    payment: serializePayment(payment),
    invoice: serializeInvoice(invoice),
  });
});

paymentsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  const data: Prisma.PaymentUpdateInput = {};
  if (req.body.amount != null) data.amount = Number(req.body.amount);
  if (req.body.method != null) data.method = String(req.body.method);
  if (req.body.paymentDateTime) data.paymentDateTime = new Date(req.body.paymentDateTime);
  if (req.body.invoiceId != null) {
    data.invoice = { connect: { id: Number(req.body.invoiceId) } };
  }
  const payment = await prisma.payment.update({ where: { id }, data });
  const invoice = await refreshInvoicePaid(payment.invoiceId);
  if (existing.invoiceId !== payment.invoiceId) {
    await refreshInvoicePaid(existing.invoiceId);
  }
  res.json({
    payment: serializePayment(payment),
    invoice: serializeInvoice(invoice),
  });
});

paymentsRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  await prisma.payment.delete({ where: { id } });
  const invoice = await refreshInvoicePaid(existing.invoiceId);
  res.json({ ok: true, invoice: serializeInvoice(invoice) });
});
