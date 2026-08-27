import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ErrorRequestHandler } from "express";
import { isProd, jwtSecret, port, publicOrigin } from "./env.js";
import { bootstrapAdmin } from "./bootstrap.js";
import { ensureDatabase } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { publicAppointmentsRouter } from "./routes/appointments.js";
import { meRouter } from "./routes/me.js";
import { websiteRouter } from "./routes/website.js";
import { staffRouter } from "./routes/staff/index.js";

jwtSecret();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);

const origins = [publicOrigin, process.env.WEBSITE_ORIGIN, process.env.FRONTEND_ORIGIN]
  .filter((value): value is string => Boolean(value))
  .map((value) => value.replace(/\/$/, ""));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (!isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, origins.includes(origin));
    },
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many login attempts. Try again later." },
  })
);
app.use("/api/auth", authRouter);
app.use("/api/website", websiteRouter);
app.use("/api/appointments", publicAppointmentsRouter);
app.use("/api/me", meRouter);
app.use("/api/staff", staffRouter);

const websiteDir = path.resolve(__dirname, "../public/website");
const appDir = path.resolve(__dirname, "../public/app");

if (fs.existsSync(appDir)) {
  app.use("/app", express.static(appDir, { index: false }));
  app.use("/app", (_req, res) => {
    res.sendFile(path.join(appDir, "index.html"));
  });
}

if (fs.existsSync(websiteDir)) {
  app.use(express.static(websiteDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/app")
    ) {
      next();
      return;
    }
    res.sendFile(path.join(websiteDir, "index.html"));
  });
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: isProd ? "Server error" : err.message || "Server error" });
};
app.use(errorHandler);

async function start() {
  ensureDatabase();
  await bootstrapAdmin();
  app.listen(port, "0.0.0.0", () => {
    console.log(`FIABA listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
