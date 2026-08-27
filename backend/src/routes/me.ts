import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";
import { serializeInvoice } from "../utils/money.js";

export const meRouter = Router();
meRouter.use(requireAuth, requireClient);

const eventInclude = {
  contracts: {
    include: {
      invoices: { include: { payments: true } },
    },
  },
  meetings: {
    include: { items: true },
    orderBy: { scheduledAt: "desc" as const },
  },
};

function serializeEvent<T extends { contracts?: Array<{ invoices?: unknown[] }> }>(event: T) {
  return {
    ...event,
    contracts: event.contracts?.map((c) => ({
      ...c,
      invoices: c.invoices?.map((inv) =>
        serializeInvoice(inv as Parameters<typeof serializeInvoice>[0])
      ),
    })),
  };
}

meRouter.get("/events", async (req, res) => {
  const events = await prisma.event.findMany({
    where: { clientId: req.client.id },
    orderBy: { id: "desc" },
    include: eventInclude,
  });
  res.json(events.map(serializeEvent));
});

meRouter.get("/events/:id", async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: Number(req.params.id), clientId: req.client.id },
    include: eventInclude,
  });
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(serializeEvent(event));
});

meRouter.get("/appointments", async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { clientId: req.client.id },
    orderBy: { requestedAt: "desc" },
  });
  res.json(appointments);
});

meRouter.post("/appointments", async (req, res) => {
  const { requestedAt, message, guestPhone } = req.body ?? {};
  if (!requestedAt) {
    res.status(400).json({ error: "Preferred date is required" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.client.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const appointment = await prisma.appointment.create({
    data: {
      clientId: req.client.id,
      guestName: user.name,
      guestEmail: user.email,
      guestPhone: guestPhone || req.client.phone,
      message: message ? String(message) : "",
      requestedAt: new Date(requestedAt),
      status: "pending",
    },
  });
  res.status(201).json(appointment);
});
