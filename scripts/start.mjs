import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "backend/dist/index.js");
const website = path.join(root, "backend/public/website/index.html");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(entry) || !fs.existsSync(website)) {
  console.log("Build output missing. Compiling website, portal, and API...");
  run("npm", ["run", "build"]);
}

if (!fs.existsSync(entry)) {
  console.error("backend/dist/index.js was not created. Check the build logs.");
  process.exit(1);
}

await import(pathToFileURL(entry).href);
