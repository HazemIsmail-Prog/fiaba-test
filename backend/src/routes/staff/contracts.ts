import { Router } from "express";
import type { ContractStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";
import { nextDocumentNumber, serializeInvoice } from "../../utils/money.js";

export const contractsRouter = Router();
const canRead = requireRole("admin", "manager", "accountant", "secretary");
const canManage = requireRole("admin", "manager");

const include = {
  invoices: { include: { payments: true } },
  event: { include: { client: { include: { user: true } } } },
} satisfies Prisma.ContractInclude;

function serializeUser(user: { id: number; email: string; name: string; role: string } | null | undefined) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function serialize(contract: {
  invoices?: unknown[];
  event?: { client?: { user?: Parameters<typeof serializeUser>[0] } | null } | null;
}) {
  const event = contract.event;
  return {
    ...contract,
    invoices: contract.invoices?.map((inv) =>
      serializeInvoice(inv as Parameters<typeof serializeInvoice>[0])
    ),
    event: event
      ? {
          ...event,
          client: event.client
            ? { ...event.client, user: serializeUser(event.client.user) }
            : event.client,
        }
      : event,
  };
}

contractsRouter.get("/", canRead, async (req, res) => {
  const where = req.query.eventId ? { eventId: Number(req.query.eventId) } : {};
  const contracts = await prisma.contract.findMany({
    where,
    include,
    orderBy: { id: "desc" },
  });
  res.json(contracts.map(serialize));
});

contractsRouter.get("/:id", canRead, async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: Number(req.params.id) },
    include,
  });
  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  res.json(serialize(contract));
});

contractsRouter.post("/", canManage, async (req, res) => {
  const { eventId, status } = req.body ?? {};
  if (!eventId) {
    res.status(400).json({ error: "eventId is required" });
    return;
  }
  const contractNumber = await nextDocumentNumber("CON", "contract");
  const contract = await prisma.contract.create({
    data: {
      eventId: Number(eventId),
      contractNumber,
      status: (status as ContractStatus) || "draft",
    },
    include,
  });
  res.status(201).json(serialize(contract));
});

contractsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  const data: Prisma.ContractUpdateInput = {};
  if (req.body.status != null) data.status = req.body.status as ContractStatus;
  if (req.body.eventId != null) {
    data.event = { connect: { id: Number(req.body.eventId) } };
  }
  const contract = await prisma.contract.update({ where: { id }, data, include });
  res.json(serialize(contract));
});

contractsRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  await prisma.contract.delete({ where: { id } });
  res.json({ ok: true });
});
