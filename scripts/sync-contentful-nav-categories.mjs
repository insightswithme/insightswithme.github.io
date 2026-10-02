/**
 * Ensures Contentful content types + seed data for:
 *  - category
 *  - navigationItem
 * Then writes local JSON used by the Next.js site at build/dev time:
 *  - content/generated/categories.json
 *  - content/generated/navigation.json
 *
 *   node scripts/sync-contentful-nav-categories.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "content", "generated");
const LOCALE = "en-US";

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
    err.data = data;
    throw err;
  }
  return data;
}

async function ensureContentType(spaceId, envId, token, id, definition) {
  let existing = null;
  try {
    existing = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/content_types/${id}`,
      { token }
    );
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${id}`,
    {
      token,
      version: existing?.sys?.version,
      body: definition,
    }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${id}/published`,
    { token, version: saved.sys.version }
  );
  console.log(`Content type ready: ${id}`);
}

async function listEntries(spaceId, envId, token, contentType) {
  const items = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const q = new URLSearchParams({
      content_type: contentType,
      limit: "100",
      skip: String(skip),
    });
    const page = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
      { token }
    );
    total = page.total;
    items.push(...page.items);
    skip += page.items.length;
    if (!page.items.length) break;
  }
  return items;
}

async function upsertByField(
  spaceId,
  envId,
  token,
  contentType,
  uniqueField,
  uniqueValue,
  fields
) {
  const q = new URLSearchParams({
    content_type: contentType,
    [`fields.${uniqueField}`]: uniqueValue,
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  let entry = found.items?.[0];
  if (entry) {
    entry = await cma(
      "PUT",
      `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
      { token, version: entry.sys.version, body: { fields } }
    );
  } else {
    entry = await cma(
      "POST",
      `/spaces/${spaceId}/environments/${envId}/entries`,
      { token, body: { fields }, contentTypeId: contentType }
    );
  }
  entry = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: entry.sys.version }
  );
  return entry;
}

function defaultCategories() {
  const tagsPath = path.join(root, "content", "meta", "tags.yml");
  if (!fs.existsSync(tagsPath)) return [];
  const data = yaml.load(fs.readFileSync(tagsPath, "utf8"));
  return (data.tags || []).map((t, index) => ({
    slug: t.slug,
    name: t.name,
    description:
      (t.description || "").trim() ||
      `Articles and tutorials about ${t.name} for Sitecore and .NET developers.`,
    order: index + 1,
  }));
}

function defaultNavigation() {
  return [
    { label: "Blogs", href: "/blogs", order: 1, location: "both" },
    { label: "Categories", href: "/categories", order: 2, location: "both" },
    { label: "Search", href: "/search", order: 3, location: "header" },
    { label: "Portfolio", href: "/portfolio", order: 4, location: "header" },
    { label: "SUGCON", href: "/sugcon", order: 5, location: "header" },
    { label: "About", href: "/about", order: 6, location: "both" },
    { label: "Contact", href: "/contact", order: 7, location: "both" },
    { label: "Privacy Policy", href: "/privacy", order: 8, location: "both" },
  ];
}

async function fetchDelivery(spaceId, token, envId, contentType, orderField) {
  const { createClient } = await import("contentful");
  const client = createClient({
    space: spaceId,
    accessToken: token,
    environment: envId,
  });
  const res = await client.getEntries({
    content_type: contentType,
    order: [orderField],
    limit: 100,
  });
  return res.items;
}

function writeJson(fileName, data) {
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote ${filePath}`);
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const cdaToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";

  const categoryType = {
    name: "Category",
    description: "Blog categories shown on /categories and related navigation",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: false,
      },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [
          { unique: true },
          {
            regexp: {
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              flags: null,
            },
          },
        ],
      },
      {
        id: "description",
        name: "Description",
        type: "Text",
        required: false,
        localized: false,
      },
      {
        id: "order",
        name: "Order",
        type: "Integer",
        required: false,
        localized: false,
      },
    ],
  };

  const navigationType = {
    name: "Navigation Item",
    description: "Header / footer navigation links",
    displayField: "label",
    fields: [
      {
        id: "label",
        name: "Label",
        type: "Symbol",
        required: true,
        localized: false,
      },
      {
        id: "href",
        name: "Href",
        type: "Symbol",
        required: true,
        localized: false,
      },
      {
        id: "order",
        name: "Order",
        type: "Integer",
        required: false,
        localized: false,
      },
      {
        id: "location",
        name: "Location",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [
          {
            in: ["header", "footer", "both"],
          },
        ],
      },
      {
        id: "openInNewTab",
        name: "Open in new tab",
        type: "Boolean",
        required: false,
        localized: false,
      },
    ],
  };

  let categories = defaultCategories();
  let navigation = defaultNavigation();

  if (spaceId && cmaToken && !process.env.GITHUB_ACTIONS) {
    await ensureContentType(spaceId, envId, cmaToken, "category", categoryType);
    await ensureContentType(
      spaceId,
      envId,
      cmaToken,
      "navigationItem",
      navigationType
    );

    const existingCategories = await listEntries(
      spaceId,
      envId,
      cmaToken,
      "category"
    );
    if (existingCategories.length === 0) {
      console.log("Seeding categories…");
      for (const cat of categories) {
        await upsertByField(spaceId, envId, cmaToken, "category", "slug", cat.slug, {
          name: { [LOCALE]: cat.name },
          slug: { [LOCALE]: cat.slug },
          description: { [LOCALE]: cat.description },
          order: { [LOCALE]: cat.order },
        });
        console.log(`  category: ${cat.slug}`);
      }
    } else {
      console.log(`Categories already present: ${existingCategories.length}`);
    }

    const existingNav = await listEntries(
      spaceId,
      envId,
      cmaToken,
      "navigationItem"
    );
    if (existingNav.length === 0) {
      console.log("Seeding navigation items…");
      for (const item of navigation) {
        await upsertByField(
          spaceId,
          envId,
          cmaToken,
          "navigationItem",
          "href",
          item.href,
          {
            label: { [LOCALE]: item.label },
            href: { [LOCALE]: item.href },
            order: { [LOCALE]: item.order },
            location: { [LOCALE]: item.location },
            openInNewTab: { [LOCALE]: false },
          }
        );
        console.log(`  nav: ${item.label}`);
      }
    } else {
      console.log(`Navigation items already present: ${existingNav.length}`);
    }
  } else if (process.env.GITHUB_ACTIONS) {
    console.log("CI: skipping Contentful CMA writes (Delivery API only)");
  } else {
    console.warn(
      "No CONTENTFUL_MANAGEMENT_TOKEN — writing local defaults only."
    );
  }

  if (spaceId && cdaToken) {
    try {
      const catEntries = await fetchDelivery(
        spaceId,
        cdaToken,
        envId,
        "category",
        "fields.order"
      );
      if (catEntries.length) {
        categories = catEntries.map((e, i) => ({
          slug: e.fields.slug,
          name: e.fields.name,
          description:
            e.fields.description ||
            `Articles and tutorials about ${e.fields.name} for Sitecore and .NET developers.`,
          order: e.fields.order ?? i + 1,
        }));
      }

      const navEntries = await fetchDelivery(
        spaceId,
        cdaToken,
        envId,
        "navigationItem",
        "fields.order"
      );
      if (navEntries.length) {
        navigation = navEntries.map((e, i) => {
          const raw = String(e.fields.location || "both")
            .toLowerCase()
            .trim();
          const location = ["header", "footer", "both"].includes(raw)
            ? raw
            : "both";
          return {
            label: e.fields.label,
            href: e.fields.href,
            order: e.fields.order ?? i + 1,
            location,
            openInNewTab: Boolean(e.fields.openInNewTab),
          };
        });
      }
    } catch (err) {
      console.warn(
        "Delivery fetch failed; using defaults/seed data.",
        err.message || err
      );
    }
  }

  categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  navigation.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  writeJson("categories.json", { generatedAt: new Date().toISOString(), items: categories });
  writeJson("navigation.json", { generatedAt: new Date().toISOString(), items: navigation });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
