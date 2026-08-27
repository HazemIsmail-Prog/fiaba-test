import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensureDatabase } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const websiteRouter = Router();

async function loadWebsiteRow() {
  return (
    (await prisma.websiteContent.findFirst()) ??
    (await prisma.websiteContent.create({
      data: { sections: [] },
    }))
  );
}

websiteRouter.get("/", async (_req, res) => {
  try {
    res.json(await loadWebsiteRow());
  } catch (err) {
    console.error("website GET failed:", err);
    try {
      ensureDatabase();
      res.json(await loadWebsiteRow());
    } catch (retryErr) {
      console.error("website GET retry failed:", retryErr);
      res.status(500).json({ error: "Server error" });
    }
  }
});

websiteRouter.put("/", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  const sections = req.body?.sections;
  if (!Array.isArray(sections)) {
    res.status(400).json({ error: "sections must be an array" });
    return;
  }
  const existing = await prisma.websiteContent.findFirst();
  const row = existing
    ? await prisma.websiteContent.update({
        where: { id: existing.id },
        data: { sections },
      })
    : await prisma.websiteContent.create({ data: { sections } });
  res.json(row);
});

websiteRouter.post(
  "/upload",
  requireAuth,
  requireRole("admin", "manager"),
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  }
);
