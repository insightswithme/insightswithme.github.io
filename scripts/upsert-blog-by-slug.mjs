/**
 * Upsert a single markdown blog into Contentful (create + publish).
 * Usage: node scripts/upsert-blog-by-slug.mjs <slug>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { spawnSync } from "child_process";

const slugArg = process.argv[2];
if (!slugArg) {
  console.error("Usage: node scripts/upsert-blog-by-slug.mjs <slug>");
  process.exit(1);
}

process.env.CONTENTFUL_UPLOAD_IMAGES = process.env.CONTENTFUL_UPLOAD_IMAGES || "1";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogsDir = path.join(root, "content", "blogs");
const target = `${slugArg}.md`;
const orig = fs.readdirSync.bind(fs);
fs.readdirSync = (dir, ...rest) => {
  if (path.resolve(dir) === path.resolve(blogsDir)) {
    if (!fs.existsSync(path.join(blogsDir, target))) {
      throw new Error(`Missing ${target}`);
    }
    return [target];
  }
  return orig(dir, ...rest);
};

await import("./migrate-blogs-to-contentful.mjs");
