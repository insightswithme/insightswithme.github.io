/**
 * Ensures Contentful `page` content type, seeds nav pages (if missing),
 * and writes content/generated/pages.json.
 *
 *   node scripts/sync-contentful-pages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { allPageSeeds } from "./page-seeds.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "content", "generated");
const LOCALE = "en-US";
const CONTENT_TYPE = "page";

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
    headers["Content-Type"] =
      "application/vnd.contentful.management.v1+json";
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
    const err = new Error(
      `${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

async function ensureContentType(spaceId, envId, token) {
  const definition = {
    name: "Page",
    description: "Static site pages managed in Contentful",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [
          { unique: true },
          { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: null } },
        ],
      },
      {
        id: "metaDescription",
        name: "Meta Description",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 320 } }],
      },
      { id: "eyebrow", name: "Eyebrow", type: "Symbol", required: false, localized: false },
      {
        id: "headline",
        name: "Headline",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 256 } }],
      },
      { id: "intro", name: "Intro", type: "Text", required: false, localized: false },
      { id: "body", name: "Body", type: "Text", required: false, localized: false },
      {
        id: "heroImage",
        name: "Hero Image",
        type: "Link",
        linkType: "Asset",
        required: false,
        localized: false,
        validations: [{ linkMimetypeGroup: ["image"] }],
      },
      {
        id: "heroImageUrl",
        name: "Hero Image URL",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 512 } }],
      },
      {
        id: "linkedinUrl",
        name: "LinkedIn URL",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 512 } }],
      },
      {
        id: "careerStartYear",
        name: "Career Start Year",
        type: "Integer",
        required: false,
        localized: false,
      },
      {
        id: "sitecoreStartYear",
        name: "Sitecore Start Year",
        type: "Integer",
        required: false,
        localized: false,
      },
    ],
  };

  let existing = null;
  try {
    existing = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}`,
      { token }
    );
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}`,
    { token, version: existing?.sys?.version, body: definition }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}/published`,
    { token, version: saved.sys.version }
  );
  console.log(`Content type ready: ${CONTENT_TYPE}`);
}

function toFields(page) {
  const fields = {
    title: { [LOCALE]: page.title },
    slug: { [LOCALE]: page.slug },
    metaDescription: { [LOCALE]: page.metaDescription || "" },
    eyebrow: { [LOCALE]: page.eyebrow || "" },
    headline: { [LOCALE]: page.headline || "" },
    intro: { [LOCALE]: page.intro || "" },
    body: { [LOCALE]: page.body || "" },
    heroImageUrl: { [LOCALE]: page.heroImageUrl || "" },
    linkedinUrl: { [LOCALE]: page.linkedinUrl || "" },
  };
  if (page.careerStartYear != null) {
    fields.careerStartYear = { [LOCALE]: page.careerStartYear };
  }
  if (page.sitecoreStartYear != null) {
    fields.sitecoreStartYear = { [LOCALE]: page.sitecoreStartYear };
  }
  return fields;
}

async function ensurePage(spaceId, envId, token, page) {
  const q = new URLSearchParams({
    content_type: CONTENT_TYPE,
    "fields.slug": page.slug,
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );

  if (found.items?.[0]) {
    console.log(`Exists (skip seed): ${page.slug}`);
    return;
  }

  const entry = await cma(
    "POST",
    `/spaces/${spaceId}/environments/${envId}/entries`,
    { token, body: { fields: toFields(page) }, contentTypeId: CONTENT_TYPE }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: entry.sys.version }
  );
  console.log(`Created + published: ${page.slug}`);
}

async function fetchPages(spaceId, cdaToken, envId) {
  const { createClient } = await import("contentful");
  const client = createClient({
    space: spaceId,
    accessToken: cdaToken,
    environment: envId,
  });
  const res = await client.getEntries({
    content_type: CONTENT_TYPE,
    limit: 100,
  });
  return res.items.map((e) => ({
    title: e.fields.title || "",
    slug: e.fields.slug || "",
    metaDescription: e.fields.metaDescription || "",
    eyebrow: e.fields.eyebrow || "",
    headline: e.fields.headline || "",
    intro: e.fields.intro || "",
    body: e.fields.body || "",
    heroImageUrl: e.fields.heroImageUrl || "",
    linkedinUrl: e.fields.linkedinUrl || "",
    careerStartYear: e.fields.careerStartYear ?? null,
    sitecoreStartYear: e.fields.sitecoreStartYear ?? null,
  }));
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const cdaToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const seeds = allPageSeeds();
  let pages = seeds;

  if (spaceId && cmaToken && !process.env.GITHUB_ACTIONS) {
    await ensureContentType(spaceId, envId, cmaToken);
    for (const page of seeds) {
      await ensurePage(spaceId, envId, cmaToken, page);
    }
  } else if (process.env.GITHUB_ACTIONS) {
    console.log("CI: skipping Contentful CMA writes (Delivery API only)");
  } else {
    console.warn("No CMA token — writing local seeds only.");
  }

  if (spaceId && cdaToken) {
    try {
      const remote = await fetchPages(spaceId, cdaToken, envId);
      if (remote.length) pages = remote;
    } catch (err) {
      console.warn("Delivery fetch failed:", err.message || err);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "pages.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), items: pages },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote ${outPath} (${pages.length} page(s))`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
