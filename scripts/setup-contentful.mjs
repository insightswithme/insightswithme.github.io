/**
 * One-shot Contentful setup:
 *  1) Create/publish blogPost content type
 *  2) Migrate local content/blogs/*.md into Contentful
 *  3) Verify Delivery API
 *
 *   npm run contentful:setup
 *
 * Optional:
 *   CONTENTFUL_UPLOAD_IMAGES=1  — upload featured images as assets
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(script, label) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(process.execPath, [path.join("scripts", script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("create-contentful-blog-post-type.mjs", "Create blogPost content type");
run("migrate-blogs-to-contentful.mjs", "Migrate markdown posts");
run("sync-contentful-nav-categories.mjs", "Sync navigation + categories");
run("sync-contentful-pages.mjs", "Sync pages (About)");
run("sync-contentful-portfolio.mjs", "Sync portfolio sections");
run("sync-contentful-footer.mjs", "Sync footer copy");
run("sync-contentful-comments.mjs", "Sync blog comments type");
run("verify-contentful.mjs", "Verify Delivery API");

console.log("\nContentful setup complete.");
console.log("Run `npm run dev` — posts, nav, and categories load from Contentful.");
