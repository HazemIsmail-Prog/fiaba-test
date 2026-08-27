import { Router } from "express";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole, publicUser } from "../../middleware/auth.js";

export const appointmentsRouter = Router();
const canManage = requireRole("admin", "manager", "secretary");

appointmentsRouter.get("/", canManage, async (req, res) => {
  const where: Prisma.AppointmentWhereInput = {};
  if (req.query.clientId) where.clientId = Number(req.query.clientId);
  if (req.query.status) where.status = req.query.status as AppointmentStatus;
  const appointments = await prisma.appointment.findMany({
    where,
    include: { client: { include: { user: true } } },
    orderBy: { requestedAt: "desc" },
  });
  res.json(
    appointments.map((a) => ({
      ...a,
      client: a.client ? { ...a.client, user: publicUser(a.client.user) } : null,
    }))
  );
});

appointmentsRouter.get("/:id", canManage, async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: Number(req.params.id) },
    include: { client: { include: { user: true } } },
  });
  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(appointment);
});

appointmentsRouter.post("/", canManage, async (req, res) => {
  const { guestName, guestEmail, guestPhone, requestedAt, message, clientId, status } =
    req.body ?? {};
  if (!guestName || !guestEmail || !guestPhone || !requestedAt) {
    res.status(400).json({
      error: "guestName, guestEmail, guestPhone, and requestedAt are required",
    });
    return;
  }
  const appointment = await prisma.appointment.create({
    data: {
      guestName: String(guestName).trim(),
      guestEmail: String(guestEmail).trim().toLowerCase(),
      guestPhone: String(guestPhone).trim(),
      message: message ?? "",
      requestedAt: new Date(requestedAt),
      clientId: clientId ? Number(clientId) : null,
      status: (status as AppointmentStatus) || "pending",
    },
  });
  res.status(201).json(appointment);
});

appointmentsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  const data: Prisma.AppointmentUpdateInput = {};
  if (req.body.guestName != null) data.guestName = req.body.guestName;
  if (req.body.guestEmail != null) data.guestEmail = req.body.guestEmail;
  if (req.body.guestPhone != null) data.guestPhone = req.body.guestPhone;
  if (req.body.message != null) data.message = req.body.message;
  if (req.body.status != null) data.status = req.body.status as AppointmentStatus;
  if (req.body.requestedAt) data.requestedAt = new Date(req.body.requestedAt);
  if (req.body.clientId !== undefined) {
    data.client = req.body.clientId
      ? { connect: { id: Number(req.body.clientId) } }
      : { disconnect: true };
  }
  const appointment = await prisma.appointment.update({ where: { id }, data });
  res.json(appointment);
});

appointmentsRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  await prisma.appointment.delete({ where: { id } });
  res.json({ ok: true });
});
