import { Router } from "express";
import type { MeetingItemStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";

export const meetingItemsRouter = Router();
const canManage = requireRole("admin", "manager", "secretary");

meetingItemsRouter.get("/", canManage, async (req, res) => {
  const where = req.query.meetingId ? { meetingId: Number(req.query.meetingId) } : {};
  const items = await prisma.meetingItem.findMany({
    where,
    include: { meeting: true },
    orderBy: { id: "desc" },
  });
  res.json(items);
});

meetingItemsRouter.get("/:id", canManage, async (req, res) => {
  const item = await prisma.meetingItem.findUnique({
    where: { id: Number(req.params.id) },
    include: { meeting: true },
  });
  if (!item) {
    res.status(404).json({ error: "Meeting item not found" });
    return;
  }
  res.json(item);
});

meetingItemsRouter.post("/", canManage, async (req, res) => {
  const { meetingId, name, category, status, notes } = req.body ?? {};
  if (!meetingId || !name) {
    res.status(400).json({ error: "meetingId and name are required" });
    return;
  }
  const item = await prisma.meetingItem.create({
    data: {
      meetingId: Number(meetingId),
      name: String(name).trim(),
      category: category ?? "",
      status: (status as MeetingItemStatus) || "pending",
      notes: notes ?? "",
    },
  });
  res.status(201).json(item);
});

meetingItemsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.meetingItem.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Meeting item not found" });
    return;
  }
  const data: Prisma.MeetingItemUpdateInput = {};
  if (req.body.name != null) data.name = req.body.name;
  if (req.body.category != null) data.category = req.body.category;
  if (req.body.status != null) data.status = req.body.status as MeetingItemStatus;
  if (req.body.notes != null) data.notes = req.body.notes;
  if (req.body.meetingId != null) {
    data.meeting = { connect: { id: Number(req.body.meetingId) } };
  }
  const item = await prisma.meetingItem.update({ where: { id }, data });
  res.json(item);
});

meetingItemsRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.meetingItem.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Meeting item not found" });
    return;
  }
  await prisma.meetingItem.delete({ where: { id } });
  res.json({ ok: true });
});
