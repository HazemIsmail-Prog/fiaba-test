import { Router } from "express";
import type { EventStatus, Prisma, User } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";
import { serializeInvoice } from "../../utils/money.js";

export const eventsRouter = Router();
const canManage = requireRole("admin", "manager", "secretary");
const canRead = requireRole("admin", "manager", "secretary", "accountant");

const include = {
  client: { include: { user: true } },
  contracts: { include: { invoices: { include: { payments: true } } } },
  meetings: { include: { items: true } },
} satisfies Prisma.EventInclude;

function serialize(event: {
  client?: { user?: User | null } | null;
  contracts?: Array<{ invoices?: unknown[] }>;
}) {
  const user = event.client?.user;
  return {
    ...event,
    client: event.client
      ? {
          ...event.client,
          user: user
            ? { id: user.id, email: user.email, name: user.name, role: user.role }
            : user,
        }
      : event.client,
    contracts: event.contracts?.map((c) => ({
      ...c,
      invoices: c.invoices?.map((inv) =>
        serializeInvoice(inv as Parameters<typeof serializeInvoice>[0])
      ),
    })),
  };
}

eventsRouter.get("/", canRead, async (req, res) => {
  const where = req.query.clientId ? { clientId: Number(req.query.clientId) } : {};
  const events = await prisma.event.findMany({
    where,
    include,
    orderBy: { id: "desc" },
  });
  res.json(events.map(serialize));
});

eventsRouter.get("/:id", canRead, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(req.params.id) },
    include,
  });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(serialize(event));
});

eventsRouter.post("/", canManage, async (req, res) => {
  const { clientId, title, type, status, location, eventDate } = req.body ?? {};
  if (!clientId || !title || !type) {
    res.status(400).json({ error: "clientId, title, and type are required" });
    return;
  }
  const event = await prisma.event.create({
    data: {
      clientId: Number(clientId),
      title: String(title).trim(),
      type: String(type).trim(),
      status: (status as EventStatus) || "inquiry",
      location: location ?? "",
      eventDate: eventDate ? new Date(eventDate) : null,
    },
    include,
  });
  res.status(201).json(serialize(event));
});

eventsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const data: Prisma.EventUpdateInput = {};
  if (req.body.title != null) data.title = req.body.title;
  if (req.body.type != null) data.type = req.body.type;
  if (req.body.status != null) data.status = req.body.status as EventStatus;
  if (req.body.location != null) data.location = req.body.location;
  if (req.body.clientId != null) {
    data.client = { connect: { id: Number(req.body.clientId) } };
  }
  if (req.body.eventDate !== undefined) {
    data.eventDate = req.body.eventDate ? new Date(req.body.eventDate) : null;
  }
  const event = await prisma.event.update({ where: { id }, data, include });
  res.json(serialize(event));
});

eventsRouter.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  await prisma.event.delete({ where: { id } });
  res.json({ ok: true });
});
