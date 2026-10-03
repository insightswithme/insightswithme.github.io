/**
 * Migrates content/blogs/*.md into Contentful blogPost entries (create + publish).
 *
 * Usage:
 *   node scripts/migrate-blogs-to-contentful.mjs
 *
 * Requires CONTENTFUL_SPACE_ID + CONTENTFUL_MANAGEMENT_TOKEN in .env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const blogsDir = path.join(root, "content", "blogs");
const publicDir = path.join(root, "public");
const LOCALE = "en-US";
const CONTENT_TYPE = "blogPost";

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

function tagsFromFrontmatter(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (typeof t === "object" && t ? t.tag : t))
    .filter(Boolean)
    .map(String);
}

function toIso(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function mimeFor(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

async function cma(
  method,
  urlPath,
  { token, body, version, binary, contentTypeId, extraHeaders } = {}
) {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(extraHeaders || {}),
  };
  if (version != null) headers["X-Contentful-Version"] = String(version);
  if (contentTypeId) headers["X-Contentful-Content-Type"] = contentTypeId;
  if (binary) {
    headers["Content-Type"] = "application/octet-stream";
  } else if (body !== undefined) {
    headers["Content-Type"] =
      "application/vnd.contentful.management.v1+json";
  }

  const res = await fetch(`https://api.contentful.com${urlPath}`, {
    method,
    headers,
    body: binary ? body : body !== undefined ? JSON.stringify(body) : undefined,
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

async function uploadLocalImage(spaceId, envId, token, imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return null;
  }

  const relative = imagePath.replace(/^\//, "");
  const absolute = path.join(publicDir, relative);
  if (!fs.existsSync(absolute)) {
    console.warn(`  image not found: ${absolute}`);
    return null;
  }

  const fileName = path.basename(absolute);
  const contentType = mimeFor(fileName);
  const bytes = fs.readFileSync(absolute);

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
  if (!uploadRes.ok) {
    throw new Error(`upload failed: ${JSON.stringify(upload)}`);
  }

  let asset = await cma(
    "POST",
    `/spaces/${spaceId}/environments/${envId}/assets`,
    {
      token,
      body: {
        fields: {
          title: { [LOCALE]: fileName },
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
    }
  );

  asset = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/files/${LOCALE}/process`,
    { token, version: asset.sys.version }
  );

  // Wait briefly for processing
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    asset = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}`,
      { token }
    );
    const file = asset.fields?.file?.[LOCALE];
    if (file?.url) break;
  }

  asset = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/assets/${asset.sys.id}/published`,
    { token, version: asset.sys.version }
  );

  return asset;
}

async function findEntryBySlug(spaceId, envId, token, slug) {
  const q = new URLSearchParams({
    content_type: CONTENT_TYPE,
    "fields.slug": slug,
    limit: "1",
  });
  const res = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  return res.items?.[0] || null;
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  const files = fs.readdirSync(blogsDir).filter((f) => f.endsWith(".md"));
  console.log(`Migrating ${files.length} posts…`);

  for (const filename of files) {
    const slugFromFile = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(blogsDir, filename), "utf8");
    const { data, content } = matter(raw);
    const slug = String(data.slug || slugFromFile);

    console.log(`\n→ ${slug}`);

    let asset = null;
    if (process.env.CONTENTFUL_UPLOAD_IMAGES === "1") {
      try {
        asset = await uploadLocalImage(
          spaceId,
          envId,
          token,
          data.featuredImage
        );
        if (asset) console.log(`  uploaded image ${asset.sys.id}`);
      } catch (err) {
        console.warn(`  image upload failed: ${err.message}`);
      }
    }

    const fields = {
      title: { [LOCALE]: String(data.title || slug) },
      slug: { [LOCALE]: slug },
      excerpt: {
        [LOCALE]: String(
          data.excerpt || data.description || data.metaDescription || ""
        ),
      },
      description: { [LOCALE]: String(data.description || "") },
      metaDescription: {
        [LOCALE]: String(data.metaDescription || data.description || ""),
      },
      keywords: { [LOCALE]: String(data.keywords || "") },
      date: { [LOCALE]: toIso(data.date) || new Date().toISOString() },
      tags: { [LOCALE]: tagsFromFrontmatter(data.tags) },
      author: { [LOCALE]: String(data.author || "Pawan Tyagi") },
      body: { [LOCALE]: content || "" },
      featured: { [LOCALE]: Boolean(data.featured) },
      featuredImageUrl: {
        [LOCALE]: String(data.featuredImage || ""),
      },
    };

    const modified = toIso(data.modifiedDate);
    if (modified) fields.modifiedDate = { [LOCALE]: modified };
    if (asset) {
      fields.featuredImage = {
        [LOCALE]: {
          sys: { type: "Link", linkType: "Asset", id: asset.sys.id },
        },
      };
    }
    if (data.faq) fields.faq = { [LOCALE]: data.faq };
    if (data.howto) fields.howto = { [LOCALE]: data.howto };

    let entry = await findEntryBySlug(spaceId, envId, token, slug);
    if (entry?.fields?.featuredImage && !fields.featuredImage) {
      fields.featuredImage = entry.fields.featuredImage;
    }
    if (entry?.fields?.bodyImages) {
      fields.bodyImages = entry.fields.bodyImages;
    }
    if (entry?.fields?.commentsEnabled && !fields.commentsEnabled) {
      fields.commentsEnabled = entry.fields.commentsEnabled;
    }
    if (entry) {
      entry = await cma(
        "PUT",
        `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
        { token, version: entry.sys.version, body: { fields } }
      );
      console.log(`  updated ${entry.sys.id}`);
    } else {
      entry = await cma(
        "POST",
        `/spaces/${spaceId}/environments/${envId}/entries`,
        {
          token,
          body: { fields },
          contentTypeId: CONTENT_TYPE,
        }
      );
      console.log(`  created ${entry.sys.id}`);
    }

    entry = await cma(
      "PUT",
      `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
      { token, version: entry.sys.version }
    );
    console.log(`  published`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
