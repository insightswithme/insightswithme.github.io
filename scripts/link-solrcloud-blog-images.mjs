/**
 * Link SolrCloud post images as Contentful assets (bodyImages + featuredImage)
 * and rewrite markdown to media/filename refs (resolved at read time).
 *
 *   node scripts/link-solrcloud-blog-images.mjs
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
const MD_PATH = path.join(
  root,
  "content",
  "blogs",
  `${SLUG}.md`
);
const CTF_ASSET =
  /https?:\/\/(?:images|assets)\.ctfassets\.net\/[^/\s)]+\/([a-zA-Z0-9]+)\/[^/\s)]+\/([^)\s]+)/g;

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
    throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function collectCdnAssets(text) {
  const found = [];
  const seen = new Set();
  const re = new RegExp(CTF_ASSET.source, "g");
  let m;
  while ((m = re.exec(text || ""))) {
    const id = m[1];
    const fileName = decodeURIComponent(m[2].split("?")[0]);
    if (seen.has(id)) continue;
    seen.add(id);
    found.push({ id, fileName, url: m[0] });
  }
  return found;
}

function toMediaRef(markdown) {
  return markdown.replace(CTF_ASSET, (_full, _id, fileName) => {
    const name = decodeURIComponent(String(fileName).split("?")[0]);
    return `media/${name}`;
  });
}

function assetLink(id) {
  return { sys: { type: "Link", linkType: "Asset", id } };
}

async function ensureBodyImagesField(spaceId, envId, token) {
  const type = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/content_types/blogPost`,
    { token }
  );
  const fields = Array.isArray(type.fields) ? [...type.fields] : [];
  if (fields.some((f) => f.id === "bodyImages")) {
    console.log("blogPost.bodyImages already present");
    return;
  }
  fields.push({
    id: "bodyImages",
    name: "Body images",
    type: "Array",
    required: false,
    localized: false,
    items: {
      type: "Link",
      linkType: "Asset",
      validations: [{ linkMimetypeGroup: ["image"] }],
    },
  });
  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/blogPost`,
    {
      token,
      version: type.sys.version,
      body: {
        name: type.name,
        description: type.description || "",
        displayField: type.displayField,
        fields,
      },
    }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/blogPost/published`,
    { token, version: saved.sys.version }
  );
  console.log("Added blogPost.bodyImages");
}

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  await ensureBodyImagesField(spaceId, envId, token);

  const parsed = matter(fs.readFileSync(MD_PATH, "utf8"));
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

  const currentBody = entry.fields?.body?.[LOCALE] || parsed.content || "";
  const featuredCdn = String(
    entry.fields?.featuredImageUrl?.[LOCALE] || parsed.data.featuredImage || ""
  );
  const bodyAssets = collectCdnAssets(currentBody);
  const featuredAssets = collectCdnAssets(featuredCdn);
  const featuredId =
    entry.fields?.featuredImage?.[LOCALE]?.sys?.id || featuredAssets[0]?.id;

  const bodyIds = bodyAssets.map((a) => a.id).filter((id) => id !== featuredId);
  const uniqueBodyIds = [...new Set(bodyIds)];

  const nextBody = toMediaRef(currentBody);
  const fields = { ...entry.fields };
  fields.body = { [LOCALE]: nextBody };
  fields.bodyImages = {
    [LOCALE]: uniqueBodyIds.map(assetLink),
  };
  if (featuredId) {
    fields.featuredImage = { [LOCALE]: assetLink(featuredId) };
  }
  if (fields.featuredImageUrl) {
    fields.featuredImageUrl = { [LOCALE]: "" };
  }

  const updated = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
    { token, version: entry.sys.version, body: { fields } }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${updated.sys.id}/published`,
    { token, version: updated.sys.version }
  );

  const nextFm = { ...parsed.data };
  delete nextFm.featuredImage;
  fs.writeFileSync(MD_PATH, matter.stringify(nextBody, nextFm), "utf8");

  console.log(`Linked featuredImage: ${featuredId || "(none)"}`);
  console.log(`Linked bodyImages (${uniqueBodyIds.length}): ${uniqueBodyIds.join(", ")}`);
  console.log(`Rewrote markdown image refs to media/<filename>`);
  console.log(`Updated ${MD_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
