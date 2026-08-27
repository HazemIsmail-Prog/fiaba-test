import { Router } from "express";
import type { MeetingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole } from "../../middleware/auth.js";

export const meetingsRouter = Router();
const canManage = requireRole("admin", "manager", "secretary");

function serializeUser(user: { id: number; email: string; name: string; role: string } | null | undefined) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

const meetingInclude = {
  items: true,
  event: { include: { client: { include: { user: true } } } },
} satisfies Prisma.MeetingInclude;

function serializeMeeting(meeting: {
  event?: { client?: { user?: Parameters<typeof serializeUser>[0] } | null } | null;
}) {
  if (!meeting.event) return meeting;
  return {
    ...meeting,
    event: {
      ...meeting.event,
      client: meeting.event.client
        ? {
            ...meeting.event.client,
            user: serializeUser(meeting.event.client.user),
          }
        : meeting.event.client,
    },
  };
}

meetingsRouter.get("/", canManage, async (req, res) => {
  const where = req.query.eventId ? { eventId: Number(req.query.eventId) } : {};
  const meetings = await prisma.meeting.findMany({
    where,
    include: meetingInclude,
    orderBy: { scheduledAt: "desc" },
  });
  res.json(meetings.map(serializeMeeting));
});

meetingsRouter.get("/:id", canManage, async (req, res) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: Number(req.params.id) },
    include: meetingInclude,
  });
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }
  res.json(serializeMeeting(meeting));
});

meetingsRouter.post("/", canManage, async (req, res) => {
  const { eventId, scheduledAt, status } = req.body ?? {};
  if (!eventId || !scheduledAt) {
    res.status(400).json({ error: "eventId and scheduledAt are required" });
    return;
  }
  const meeting = await prisma.meeting.create({
    data: {
      eventId: Number(eventId),
      scheduledAt: new Date(scheduledAt),
      status: (status as MeetingStatus) || "scheduled",
    },
    include: meetingInclude,
  });
  res.status(201).json(serializeMeeting(meeting));
});

meetingsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }
  const data: Prisma.MeetingUpdateInput = {};
  if (req.body.status != null) data.status = req.body.status as MeetingStatus;
  if (req.body.scheduledAt) data.scheduledAt = new Date(req.body.scheduledAt);
  if (req.body.eventId != null) {
    data.event = { connect: { id: Number(req.body.eventId) } };
  }
  const meeting = await prisma.meeting.update({
    where: { id },
    data,
    include: meetingInclude,
  });
  res.json(serializeMeeting(meeting));
});

meetingsRouter.delete("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }
  await prisma.meeting.delete({ where: { id } });
  res.json({ ok: true });
});
