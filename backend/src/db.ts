import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function ensureDatabase() {
  fs.mkdirSync(path.join(backendRoot, "data"), { recursive: true });
  const prismaBin = path.join(backendRoot, "node_modules/.bin/prisma");
  const result = spawnSync(prismaBin, ["db", "push", "--skip-generate"], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`prisma db push failed with status ${result.status}`);
  }
}
