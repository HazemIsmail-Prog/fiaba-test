import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { prisma } from "../prisma.js";
import { publicUser, requireAuth } from "../middleware/auth.js";
import { jwtSecret } from "../env.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    include: { client: true },
  });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    jwtSecret(),
    { expiresIn: "7d" }
  );
  res.json({ token, user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { client: true },
  });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user: publicUser(user) });
});
