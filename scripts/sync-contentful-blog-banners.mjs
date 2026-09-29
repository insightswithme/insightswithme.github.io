/**
 * Upload local blog banner images to Contentful Assets and link them on
 * blogPost.featuredImage (source of truth). featuredImageUrl stays as fallback.
 *
 * Usage:
 *   npm run contentful:sync-banners
 *
 * Options (env):
 *   CONTENTFUL_FORCE_BANNER_SYNC=1  — re-upload/relink even when Asset is set
 *
 * Requires CONTENTFUL_SPACE_ID + CONTENTFUL_MANAGEMENT_TOKEN in .env.local
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

function localPathFromRef(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("//")) {
    return null;
  }
  const relative = imagePath.replace(/^\//, "");
  const absolute = path.join(publicDir, relative);
  return fs.existsSync(absolute) ? absolute : null;
}

async function cma(method, urlPath, { token, body, version, binary } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (version != null) headers["X-Contentful-Version"] = String(version);
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

async function findAssetByFileName(spaceId, envId, token, fileName) {
  const q = new URLSearchParams({
    "fields.title": fileName,
    limit: "5",
  });
  const res = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/assets?${q}`,
    { token }
  );
  const match = (res.items || []).find((a) => {
    const file = a.fields?.file?.[LOCALE];
    return file?.fileName === fileName || a.fields?.title?.[LOCALE] === fileName;
  });
  return match || null;
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
          description: {
            [LOCALE]: `Blog banner (${fileName})`,
          },
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

function markdownImageBySlug(slug) {
  const filePath = path.join(blogsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return "";
  const { data } = matter(fs.readFileSync(filePath, "utf8"));
  return typeof data.featuredImage === "string" ? data.featuredImage : "";
}

async function listBlogEntries(spaceId, envId, token) {
  const items = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const q = new URLSearchParams({
      content_type: CONTENT_TYPE,
      limit: "100",
      skip: String(skip),
    });
    const page = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
      { token }
    );
    total = page.total;
    items.push(...(page.items || []));
    skip += page.items?.length || 0;
    if (!page.items?.length) break;
  }
  return items;
}

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const force =
    process.env.CONTENTFUL_FORCE_BANNER_SYNC === "1" ||
    process.env.CONTENTFUL_FORCE_BANNER_SYNC === "true";

  if (!spaceId || !token) {
    throw new Error(
      "Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in .env.local"
    );
  }

  const entries = await listBlogEntries(spaceId, envId, token);
  console.log(
    `Syncing banners for ${entries.length} blogPost entries${force ? " (force)" : ""}…`
  );
  console.log(
    "Tip: pause the Contentful→GitHub Pages webhook during bulk sync to avoid one redeploy per post.\n"
  );

  let linked = 0;
  let skipped = 0;
  let missing = 0;

  for (const entry of entries) {
    const slug = entry.fields?.slug?.[LOCALE] || entry.sys.id;
    const existingLink = entry.fields?.featuredImage?.[LOCALE]?.sys?.id;
    const urlField = entry.fields?.featuredImageUrl?.[LOCALE] || "";
    const fromMd = markdownImageBySlug(slug);
    const imageRef = urlField || fromMd;

    console.log(`\n→ ${slug}`);

    if (existingLink && !force) {
      console.log(`  keep Asset ${existingLink}`);
      skipped += 1;
      continue;
    }

    const absolute = localPathFromRef(imageRef);
    if (!absolute) {
      console.warn(
        `  no local banner found (featuredImageUrl="${urlField}", md="${fromMd}")`
      );
      missing += 1;
      continue;
    }

    const asset = await uploadLocalImage(spaceId, envId, token, absolute);
    const assetId = asset.sys.id;
    const rawUrl = asset.fields?.file?.[LOCALE]?.url || "";
    const cdn = rawUrl
      ? rawUrl.startsWith("//")
        ? `https:${rawUrl}`
        : rawUrl
      : "";
    console.log(`  Asset ${assetId}${cdn ? ` → ${cdn}` : ""}`);

    const nextFields = { ...entry.fields };
    nextFields.featuredImage = {
      [LOCALE]: {
        sys: { type: "Link", linkType: "Asset", id: assetId },
      },
    };
    // Keep a relative fallback for local/markdown offline builds.
    if (!nextFields.featuredImageUrl?.[LOCALE] && imageRef) {
      nextFields.featuredImageUrl = { [LOCALE]: imageRef };
    }

    let updated = await cma(
      "PUT",
      `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
      {
        token,
        version: entry.sys.version,
        body: { fields: nextFields },
      }
    );

    updated = await cma(
      "PUT",
      `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
      { token, version: updated.sys.version }
    );
    console.log(`  published entry ${updated.sys.id}`);
    linked += 1;
  }

  console.log(
    `\nDone. linked/updated=${linked} skipped=${skipped} missing=${missing}`
  );
  console.log(
    "Banners are served from Contentful CDN via blogPost.featuredImage at build time."
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
