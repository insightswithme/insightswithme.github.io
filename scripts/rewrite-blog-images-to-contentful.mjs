/**
 * Upload inline blog images to Contentful Media and rewrite body markdown
 * to CDN URLs. Featured image stays the Asset field (already preferred).
 *
 *   node scripts/rewrite-blog-images-to-contentful.mjs <slug>
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const blogsDir = path.join(root, "content", "blogs");
const publicDir = path.join(root, "public");
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");

const LOCALE = "en-US";
const CONTENT_TYPE = "blogPost";

loadEnvFiles(root);

function mimeFor(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

function toCdn(url) {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function localPathFromRef(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("//")) return null;
  const absolute = path.join(publicDir, imagePath.replace(/^\//, ""));
  return fs.existsSync(absolute) ? absolute : null;
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
    throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function findAssetByFileName(spaceId, envId, token, fileName) {
  const q = new URLSearchParams({ "fields.title": fileName, limit: "5" });
  const res = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/assets?${q}`,
    { token }
  );
  return (
    (res.items || []).find((a) => {
      const file = a.fields?.file?.[LOCALE];
      return file?.fileName === fileName || a.fields?.title?.[LOCALE] === fileName;
    }) || null
  );
}

async function uploadLocalImage(spaceId, envId, token, absolutePath) {
  const fileName = path.basename(absolutePath);
  const existing = await findAssetByFileName(spaceId, envId, token, fileName);
  if (existing?.fields?.file?.[LOCALE]?.url) {
    if (!existing.sys.publishedVersion) {
      return cma(
        "PUT",
        `/spaces/${spaceId}/environments/${envId}/assets/${existing.sys.id}/published`,
        { token, version: existing.sys.version }
      );
    }
    return existing;
  }

  const contentType = mimeFor(fileName);
  const bytes = fs.readFileSync(absolutePath);
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

  let asset = await cma("POST", `/spaces/${spaceId}/environments/${envId}/assets`, {
    token,
    body: {
      fields: {
        title: { [LOCALE]: fileName },
        description: { [LOCALE]: `Blog media (${fileName})` },
        file: {
          [LOCALE]: {
            contentType,
            fileName,
            uploadFrom: {
              sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
            },
          },
        },
      },
    },
  });

  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/files/${LOCALE}/process`,
    { token, version: asset.sys.version }
  );

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    asset = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}`,
      { token }
    );
    if (asset.fields?.file?.[LOCALE]?.url) break;
  }
  if (!asset.fields?.file?.[LOCALE]?.url) {
    throw new Error(`Asset processing timed out for ${fileName}`);
  }
  return cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/published`,
    { token, version: asset.sys.version }
  );
}

function collectLocalImageRefs(markdown, featuredPath) {
  const refs = new Set();
  if (featuredPath && featuredPath.startsWith("/")) refs.add(featuredPath);
  const re = /!\[[^\]]*]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(markdown || ""))) {
    const src = (m[1] || "").trim().split(/\s+/)[0];
    if (src && src.startsWith("/")) refs.add(src);
  }
  return [...refs];
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error("Usage: node scripts/rewrite-blog-images-to-contentful.mjs <slug>");
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  const mdPath = path.join(blogsDir, `${slug}.md`);
  if (!fs.existsSync(mdPath)) throw new Error(`Missing ${mdPath}`);
  const parsed = matter(fs.readFileSync(mdPath, "utf8"));

  const q = new URLSearchParams({
    content_type: CONTENT_TYPE,
    "fields.slug": slug,
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  const entry = found.items?.[0];
  if (!entry) throw new Error(`No Contentful blogPost for slug ${slug}`);

  const body = entry.fields.body?.[LOCALE] || parsed.content || "";
  const featuredLocal =
    entry.fields.featuredImageUrl?.[LOCALE] || parsed.data.featuredImage || "";
  const refs = collectLocalImageRefs(body, featuredLocal);

  const map = new Map();
  for (const ref of refs) {
    const absolute = localPathFromRef(ref);
    if (!absolute) {
      console.warn(`No local file for ${ref}`);
      continue;
    }
    const asset = await uploadLocalImage(spaceId, envId, token, absolute);
    const cdn = toCdn(asset.fields?.file?.[LOCALE]?.url);
    map.set(ref, cdn);
    console.log(`${ref} → ${cdn}`);
  }

  let nextBody = body;
  for (const [local, cdn] of map) {
    nextBody = nextBody.split(local).join(cdn);
  }

  const fields = { ...entry.fields };
  fields.body = { [LOCALE]: nextBody };

  const featuredAssetId = entry.fields.featuredImage?.[LOCALE]?.sys?.id;
  if (featuredAssetId) {
    const featuredAsset = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/assets/${featuredAssetId}`,
      { token }
    );
    const featuredCdn = toCdn(featuredAsset.fields?.file?.[LOCALE]?.url);
    if (featuredCdn) {
      fields.featuredImageUrl = { [LOCALE]: featuredCdn };
    }
  } else if (map.get(featuredLocal)) {
    fields.featuredImageUrl = { [LOCALE]: map.get(featuredLocal) };
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
  console.log("Published Contentful body with Media CDN URLs");

  const nextFm = { ...parsed.data };
  if (fields.featuredImageUrl?.[LOCALE]) {
    nextFm.featuredImage = fields.featuredImageUrl[LOCALE];
  }
  fs.writeFileSync(
    mdPath,
    matter.stringify(nextBody, nextFm),
    "utf8"
  );
  console.log(`Updated ${mdPath} to match Contentful`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
