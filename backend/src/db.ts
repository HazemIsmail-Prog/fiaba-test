import fs from "fs";
import path from "path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function ensureDatabase() {
  fs.mkdirSync(path.join(backendRoot, "data"), { recursive: true });
  execSync("npx prisma db push --skip-generate", {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
}
