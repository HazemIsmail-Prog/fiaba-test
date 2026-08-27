import { Router } from "express";
import { prisma } from "../prisma.js";

export const publicAppointmentsRouter = Router();

publicAppointmentsRouter.post("/", async (req, res) => {
  const { guestName, guestEmail, guestPhone, requestedAt, message } = req.body ?? {};
  if (!guestName || !guestEmail || !guestPhone || !requestedAt) {
    res.status(400).json({
      error: "Name, email, phone, and preferred date are required",
    });
    return;
  }
  const appointment = await prisma.appointment.create({
    data: {
      guestName: String(guestName).trim(),
      guestEmail: String(guestEmail).trim().toLowerCase(),
      guestPhone: String(guestPhone).trim(),
      message: message ? String(message) : "",
      requestedAt: new Date(requestedAt),
      status: "pending",
    },
  });
  res.status(201).json(appointment);
});
