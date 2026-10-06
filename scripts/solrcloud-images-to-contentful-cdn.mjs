/**
 * Point SolrCloud post markdown images at Contentful Media CDN URLs
 * (bodyImages + featuredImage stay the source of truth).
 *
 *   node scripts/solrcloud-images-to-contentful-cdn.mjs
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");
loadEnvFiles(root);

const LOCALE = "en-US";
const SLUG = "how-to-set-up-solrcloud-with-zookeeper-for-sitecore-on-windows";
const MD_PATH = path.join(root, "content", "blogs", `${SLUG}.md`);

async function cma(method, urlPath, { token, body, version } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (version != null) headers["X-Contentful-Version"] = String(version);
  if (body !== undefined) {
    headers["Content-Type"] =
      "application/vnd.contentful.management.v1+json";
  }
  const res = await fetch(`https://api.contentful.com${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function toCdn(url) {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function fileNameFromSrc(src) {
  const cleaned = String(src).trim().split(/\s+/)[0].replace(/[?#].*$/, "");
  try {
    if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith("//")) {
      const href = cleaned.startsWith("//") ? `https:${cleaned}` : cleaned;
      return decodeURIComponent(new URL(href).pathname.split("/").pop() || "");
    }
  } catch {
    /* ignore */
  }
  return decodeURIComponent(cleaned.split("/").pop() || "");
}

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  const q = new URLSearchParams({
    content_type: "blogPost",
    "fields.slug": SLUG,
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  const entry = found.items?.[0];
  if (!entry) throw new Error(`No blogPost for ${SLUG}`);

  const parsed = matter(fs.readFileSync(MD_PATH, "utf8"));
  let body = entry.fields?.body?.[LOCALE] || parsed.content || "";

  const featuredId = entry.fields?.featuredImage?.[LOCALE]?.sys?.id;
  const bodyIds = (entry.fields?.bodyImages?.[LOCALE] || [])
    .map((l) => l?.sys?.id)
    .filter(Boolean);
  const allIds = [...new Set([featuredId, ...bodyIds].filter(Boolean))];

  const byFile = new Map();
  let featuredCdn = "";
  for (const id of allIds) {
    const asset = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/assets/${id}`,
      { token }
    );
    const file = asset.fields?.file?.[LOCALE];
    const cdn = toCdn(file?.url);
    const name = file?.fileName;
    if (name && cdn) byFile.set(name, cdn);
    if (id === featuredId) featuredCdn = cdn;
    console.log(`${id} ${name} → ${cdn}`);
  }

  const nextBody = body.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (all, alt, src) => {
      const file = fileNameFromSrc(src);
      const url = file ? byFile.get(file) : undefined;
      if (!url) {
        console.warn(`  unmatched image src: ${src}`);
        return all;
      }
      if (String(src).trim() !== url) {
        console.log(`  ${src} → ${url}`);
      }
      return `![${alt}](${url})`;
    }
  );

  const fields = { ...entry.fields };
  fields.body = { [LOCALE]: nextBody };
  if (featuredCdn) {
    fields.featuredImageUrl = { [LOCALE]: featuredCdn };
  }
  fields.modifiedDate = { [LOCALE]: new Date().toISOString() };

  let updated = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
    { token, version: entry.sys.version, body: { fields } }
  );
  updated = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${updated.sys.id}/published`,
    { token, version: updated.sys.version }
  );

  const nextFm = { ...parsed.data };
  if (featuredCdn) nextFm.featuredImage = featuredCdn;
  nextFm.modifiedDate = new Date().toISOString();
  fs.writeFileSync(MD_PATH, matter.stringify(nextBody, nextFm), "utf8");

  console.log(`Published ${updated.sys.id}`);
  console.log(`Updated ${MD_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
