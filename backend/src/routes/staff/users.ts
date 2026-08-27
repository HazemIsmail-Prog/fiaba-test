import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { requireRole, publicUser } from "../../middleware/auth.js";

export const usersRouter = Router();
const staffOnly = requireRole("admin", "manager");

usersRouter.get("/", staffOnly, async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { client: true },
    orderBy: { id: "desc" },
  });
  res.json(users.map(publicUser));
});

usersRouter.get("/:id", staffOnly, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    include: { client: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(publicUser(user));
});

usersRouter.post("/", staffOnly, async (req, res) => {
  const { email, password, name, role } = req.body ?? {};
  if (!email || !password || !name || !role) {
    res.status(400).json({ error: "email, password, name, and role are required" });
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
      role: role as Role,
    },
    include: { client: true },
  });
  if (role === "client") {
    await prisma.client.create({
      data: {
        userId: user.id,
        phone: req.body.phone ?? "",
        address: req.body.address ?? "",
        notes: req.body.notes ?? "",
      },
    });
  }
  const created = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: true },
  });
  res.status(201).json(publicUser(created));
});

usersRouter.put("/:id", staffOnly, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const data: Prisma.UserUpdateInput = {};
  if (req.body.name != null) data.name = String(req.body.name).trim();
  if (req.body.email != null) data.email = String(req.body.email).trim().toLowerCase();
  if (req.body.role != null) data.role = req.body.role as Role;
  if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.update({
    where: { id },
    data,
    include: { client: true },
  });
  res.json(publicUser(user));
});

usersRouter.delete("/:id", staffOnly, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});
