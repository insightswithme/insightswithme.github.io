import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");
loadEnvFiles(root);

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
const LOCALE = "en-US";
const slug = "sitecore-search-decoded-architecture-ingestion-and-production";
const imagePath = path.join(
  root,
  "public",
  "uploads",
  "banner-sitecore-search-decoded.jpg"
);

async function cma(method, urlPath, { body, version, binary } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (version != null) headers["X-Contentful-Version"] = String(version);
  if (binary) headers["Content-Type"] = "application/octet-stream";
  else if (body !== undefined) {
    headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
  }
  const res = await fetch(`https://api.contentful.com${urlPath}`, {
    method,
    headers,
    body: binary ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const bytes = fs.readFileSync(imagePath);
const uploadRes = await fetch(
  `https://upload.contentful.com/spaces/${spaceId}/uploads`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  }
);
const upload = await uploadRes.json();
if (!uploadRes.ok) throw new Error(`upload failed: ${JSON.stringify(upload)}`);

let asset = await cma(
  "POST",
  `/spaces/${spaceId}/environments/${envId}/assets`,
  {
    body: {
      fields: {
        title: { [LOCALE]: "banner-sitecore-search-decoded.jpg" },
        file: {
          [LOCALE]: {
            contentType: "image/jpeg",
            fileName: "banner-sitecore-search-decoded.jpg",
            uploadFrom: {
              sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
            },
          },
        },
      },
    },
  }
);

asset = await cma(
  "PUT",
  `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/files/${LOCALE}/process`,
  { version: asset.sys.version }
);

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 500));
  asset = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}`
  );
  if (asset.fields?.file?.[LOCALE]?.url) break;
}

asset = await cma(
  "PUT",
  `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/published`,
  { version: asset.sys.version }
);

const q = new URLSearchParams({
  content_type: "blogPost",
  "fields.slug": slug,
  limit: "1",
});
const found = await cma(
  "GET",
  `/spaces/${spaceId}/environments/${envId}/entries?${q}`
);
const entry = found.items[0];
const fields = { ...entry.fields };
fields.featuredImage = {
  [LOCALE]: { sys: { type: "Link", linkType: "Asset", id: asset.sys.id } },
};
fields.featuredImageUrl = {
  [LOCALE]: "/uploads/banner-sitecore-search-decoded.jpg",
};

let updated = await cma(
  "PUT",
  `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
  { version: entry.sys.version, body: { fields } }
);
updated = await cma(
  "PUT",
  `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
  { version: updated.sys.version }
);

const file = asset.fields?.file?.[LOCALE];
const cdn = file?.url?.startsWith("//") ? `https:${file.url}` : file?.url;
console.log(
  JSON.stringify(
    {
      entryId: updated.sys.id,
      assetId: asset.sys.id,
      publishedVersion: updated.sys.publishedVersion,
      cdn,
    },
    null,
    2
  )
);
