import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

const websiteDist = path.join(root, "website/dist");
const appDist = path.join(root, "frontend/dist");
if (!fs.existsSync(websiteDist) || !fs.existsSync(appDist)) {
  console.error("Build website and frontend before copying static files.");
  process.exit(1);
}

copyDir(websiteDist, path.join(root, "backend/public/website"));
copyDir(appDist, path.join(root, "backend/public/app"));
console.log("Copied website → backend/public/website");
console.log("Copied portal → backend/public/app");
