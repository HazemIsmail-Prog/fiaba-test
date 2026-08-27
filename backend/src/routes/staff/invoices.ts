import { Router } from "express";
import type { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";
import { nextDocumentNumber, refreshInvoicePaid, serializeInvoice } from "../../utils/money.js";

export const invoicesRouter = Router();
const canManage = requireRole("admin", "manager", "accountant");

const invoiceInclude = {
  payments: true,
  contract: { include: { event: { include: { client: { include: { user: true } } } } } },
} satisfies Prisma.InvoiceInclude;

function serializeUser(user: { id: number; email: string; name: string; role: string } | null | undefined) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function serializeListedInvoice(invoice: Parameters<typeof serializeInvoice>[0] & {
  contract?: {
    id: number;
    contractNumber: string;
    eventId: number;
    status: string;
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
}) {
  const base = serializeInvoice(invoice);
  if (!base) return base;
  const contract = invoice.contract;
  const event = contract?.event;
  return {
    ...base,
    contract: contract
      ? {
          id: contract.id,
          contractNumber: contract.contractNumber,
          eventId: contract.eventId,
          status: contract.status,
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
      : contract,
  };
}

invoicesRouter.get("/", canManage, async (req, res) => {
  const where = req.query.contractId ? { contractId: Number(req.query.contractId) } : {};
  const invoices = await prisma.invoice.findMany({
    where,
    include: invoiceInclude,
    orderBy: { id: "desc" },
  });
  res.json(invoices.map(serializeListedInvoice));
});

invoicesRouter.get("/:id", canManage, async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(req.params.id) },
    include: invoiceInclude,
  });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(serializeListedInvoice(invoice));
});

invoicesRouter.post("/", canManage, async (req, res) => {
  const { contractId, amount, status, invoiceDateTime, invoiceDueDate } = req.body ?? {};
  if (!contractId || amount == null || !invoiceDateTime || !invoiceDueDate) {
    res.status(400).json({
      error: "contractId, amount, invoiceDateTime, and invoiceDueDate are required",
    });
    return;
  }
  const invoiceNumber = await nextDocumentNumber("INV", "invoice");
  const invoice = await prisma.invoice.create({
    data: {
      contractId: Number(contractId),
      invoiceNumber,
      amount: Number(amount),
      paidAmount: 0,
      status: (status as InvoiceStatus) || "draft",
      invoiceDateTime: new Date(invoiceDateTime),
      invoiceDueDate: new Date(invoiceDueDate),
    },
    include: { payments: true },
  });
  res.status(201).json(serializeInvoice(invoice));
});

invoicesRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const data: Prisma.InvoiceUpdateInput = {};
  if (req.body.amount != null) data.amount = Number(req.body.amount);
  if (req.body.status != null) data.status = req.body.status as InvoiceStatus;
  if (req.body.contractId != null) {
    data.contract = { connect: { id: Number(req.body.contractId) } };
  }
  if (req.body.invoiceDateTime) data.invoiceDateTime = new Date(req.body.invoiceDateTime);
  if (req.body.invoiceDueDate) data.invoiceDueDate = new Date(req.body.invoiceDueDate);
  await prisma.invoice.update({ where: { id }, data });
  const invoice = await refreshInvoicePaid(id);
  res.json(serializeInvoice(invoice));
});

invoicesRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  await prisma.invoice.delete({ where: { id } });
  res.json({ ok: true });
});
