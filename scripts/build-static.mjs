/**
 * Static export build for GitHub Pages / Netlify.
 * Moves API routes outside `src/pages` (unsupported with output: "export"), then restores them.
 *
 *   node scripts/build-static.mjs
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "src", "pages", "api");
// Must NOT stay under src/pages — Next would treat it as a route (e.g. /_api_static_backup/...).
const apiBackup = path.join(os.tmpdir(), `pawan-tyagi-blog-api-backup-${process.pid}`);

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

let moved = false;
try {
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(apiBackup)) {
      fs.rmSync(apiBackup, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, apiBackup);
    moved = true;
    console.log(`Static build: parked src/pages/api → ${apiBackup}`);
  }

  run("npm", ["run", "prebuild"], { STATIC_EXPORT: "1" });
  run("npx", ["next", "build"], { STATIC_EXPORT: "1" });
  run("npx", ["next-sitemap"], { STATIC_EXPORT: "1" });
  run("node", ["scripts/seo-postbuild.js"], { STATIC_EXPORT: "1" });
} finally {
  if (moved && fs.existsSync(apiBackup)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(apiBackup, apiDir);
    console.log("Static build: restored src/pages/api");
  }
}
