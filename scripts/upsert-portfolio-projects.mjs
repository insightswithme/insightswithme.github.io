/**
 * Upserts portfolioProject entries from projectSeeds() (update by title or create).
 * Publishes each entry so Delivery API and the site pick them up.
 *
 *   node scripts/upsert-portfolio-projects.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { projectSeeds } from "./portfolio-seeds.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const LOCALE = "en-US";
const CONTENT_TYPE = "portfolioProject";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(root, name);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

async function cma(method, urlPath, { token, body, version, contentTypeId } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (version != null) headers["X-Contentful-Version"] = String(version);
  if (contentTypeId) headers["X-Contentful-Content-Type"] = contentTypeId;
  if (body !== undefined) {
    headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
  }
  const res = await fetch(`https://api.contentful.com${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return data;
}

function toFields(p) {
  return {
    title: { [LOCALE]: p.title },
    duration: { [LOCALE]: p.duration },
    description: { [LOCALE]: p.description },
    order: { [LOCALE]: p.order },
  };
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  const seeds = projectSeeds();
  const seedTitles = new Set(seeds.map((s) => s.title));

  // Load all existing portfolio projects
  const q = new URLSearchParams({
    content_type: CONTENT_TYPE,
    limit: "100",
  });
  const list = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  const byTitle = new Map();
  for (const e of list.items || []) {
    const title = e.fields?.title?.[LOCALE];
    if (title) byTitle.set(title, e);
  }

  for (const seed of seeds) {
    const fields = toFields(seed);
    const existing = byTitle.get(seed.title);
    let entry;
    if (existing) {
      entry = await cma(
        "PUT",
        `/spaces/${spaceId}/environments/${envId}/entries/${existing.sys.id}`,
        { token, version: existing.sys.version, body: { fields } }
      );
      console.log(`Updated: ${seed.title}`);
    } else {
      entry = await cma(
        "POST",
        `/spaces/${spaceId}/environments/${envId}/entries`,
        { token, body: { fields }, contentTypeId: CONTENT_TYPE }
      );
      console.log(`Created: ${seed.title}`);
    }
    entry = await cma(
      "PUT",
      `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
      { token, version: entry.sys.version }
    );
    console.log(`  published ${entry.sys.id}`);
    byTitle.delete(seed.title);
  }

  // Unpublish + archive old projects no longer in seeds (optional cleanup)
  for (const [title, entry] of byTitle) {
    if (seedTitles.has(title)) continue;
    try {
      if (entry.sys.publishedVersion) {
        await cma(
          "DELETE",
          `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
          { token, version: entry.sys.version }
        );
      }
      // refresh version after unpublish
      const fresh = await cma(
        "GET",
        `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
        { token }
      );
      await cma(
        "PUT",
        `/spaces/${spaceId}/environments/${envId}/entries/${fresh.sys.id}/archived`,
        { token, version: fresh.sys.version }
      );
      console.log(`Archived old project: ${title}`);
    } catch (err) {
      console.warn(`Could not archive "${title}":`, err.message || err);
    }
  }

  console.log("Done. Run portfolio sync / redeploy to refresh the site.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
