import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Prisma, User } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole, publicUser } from "../../middleware/auth.js";

export const clientsRouter = Router();
const canManage = requireRole("admin", "manager", "secretary");

function serializeClient<T extends { user?: User | null }>(client: T | null) {
  if (!client) return client;
  return {
    ...client,
    user: client.user ? publicUser(client.user) : client.user,
  };
}

clientsRouter.get("/", canManage, async (_req, res) => {
  const clients = await prisma.client.findMany({
    include: { user: true },
    orderBy: { id: "desc" },
  });
  res.json(clients.map(serializeClient));
});

clientsRouter.get("/:id", canManage, async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true, events: true, appointments: true },
  });
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(serializeClient(client));
});

clientsRouter.post("/", canManage, async (req, res) => {
  const { email, password, name, phone, address, notes } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }
  const existing = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const user = await prisma.user.create({
    data: {
      email: String(email).trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      name: String(name).trim(),
      role: "client",
      client: {
        create: {
          phone: phone ?? "",
          address: address ?? "",
          notes: notes ?? "",
        },
      },
    },
  });
  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    include: { user: true },
  });
  res.status(201).json(serializeClient(client));
});

clientsRouter.put("/:id", canManage, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const clientData: Prisma.ClientUpdateInput = {};
  if (req.body.phone != null) clientData.phone = String(req.body.phone);
  if (req.body.address != null) clientData.address = String(req.body.address);
  if (req.body.notes != null) clientData.notes = String(req.body.notes);
  const userData: Prisma.UserUpdateInput = {};
  if (req.body.name != null) userData.name = String(req.body.name).trim();
  if (req.body.email != null) userData.email = String(req.body.email).trim().toLowerCase();
  if (req.body.password) userData.passwordHash = await bcrypt.hash(req.body.password, 10);
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...clientData,
      ...(Object.keys(userData).length ? { user: { update: userData } } : {}),
    },
    include: { user: true },
  });
  res.json(serializeClient(client));
});

clientsRouter.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  await prisma.user.delete({ where: { id: existing.userId } });
  res.json({ ok: true });
});
