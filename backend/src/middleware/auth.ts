import type { NextFunction, Request, Response } from "express";
import type { Client, Role, User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import type { AuthPayload } from "../types/auth.js";
import { jwtSecret } from "../env.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export async function requireClient(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== "client") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const client = await prisma.client.findUnique({
    where: { userId: req.user.userId },
  });
  if (!client) {
    res.status(403).json({ error: "No client profile" });
    return;
  }
  req.client = client;
  next();
}

export function publicUser<T extends User | (User & { client?: Client | null }) | null>(
  user: T
) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
