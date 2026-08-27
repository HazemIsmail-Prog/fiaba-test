import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
dotenv.config({ path: path.resolve(backendRoot, ".env") });
dotenv.config();

export const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  const dbFile = path.join(backendRoot, "data", "fiaba.db");
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  process.env.DATABASE_URL = `file:${dbFile}`;
}

const WEAK_SECRETS = new Set(["change-me", "fiaba-dev-secret-change-in-production"]);

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("JWT_SECRET is not set");
  if (isProd && (secret.length < 32 || WEAK_SECRETS.has(secret))) {
    throw new Error("Set a strong JWT_SECRET (at least 32 characters) before deploying");
  }
  return secret;
}

export const port = Number(process.env.PORT) || 3000;
export const publicOrigin = (process.env.PUBLIC_ORIGIN || process.env.WEBSITE_ORIGIN || "").replace(/\/$/, "");
