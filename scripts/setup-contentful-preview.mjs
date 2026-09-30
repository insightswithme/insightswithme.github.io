/**
 * Configures Contentful Content Preview → Vercel Draft Mode.
 *
 *   node scripts/setup-contentful-preview.mjs
 *
 * Requires CONTENTFUL_SPACE_ID + CONTENTFUL_MANAGEMENT_TOKEN
 * Optional: CONTENTFUL_PREVIEW_SECRET, NEXT_PUBLIC_BASE_URL (Vercel)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const LOCALE = "en-US";
const PREVIEW_NAME = "Vercel Draft Mode";

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

async function cma(method, urlPath, { token, body, version } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/vnd.contentful.management.v1+json",
  };
  if (version != null) headers["X-Contentful-Version"] = String(version);
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

function previewDefinition(baseUrl, previewSecret) {
  const secretQ = previewSecret
    ? `&x-contentful-preview-secret=${encodeURIComponent(previewSecret)}`
    : "";
  const blogPath = `%2Fblogs%2F{entry.fields.slug}`;
  return {
    name: PREVIEW_NAME,
    description:
      "Opens Vercel Draft Mode for unpublished Contentful entries (blog posts).",
    configurations: [
      {
        contentType: "blogPost",
        enabled: true,
        example: false,
        url: `${baseUrl}/api/enable-draft?path=${blogPath}${secretQ}`,
      },
    ],
  };
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const baseUrl = (
    process.env.VERCEL_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://insightswithme-blog.vercel.app"
  ).replace(/\/$/, "");
  const previewSecret = process.env.CONTENTFUL_PREVIEW_SECRET || "";

  if (!spaceId || !token) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }
  if (!previewSecret) {
    console.warn(
      "WARNING: CONTENTFUL_PREVIEW_SECRET missing — preview URLs may get 403 on hobby plans."
    );
  }

  const list = await cma("GET", `/spaces/${spaceId}/preview_environments`, {
    token,
  });
  const existing = (list.items || []).find((p) => p.name === PREVIEW_NAME);
  const body = previewDefinition(baseUrl, previewSecret);

  let saved;
  if (existing) {
    saved = await cma(
      "PUT",
      `/spaces/${spaceId}/preview_environments/${existing.sys.id}`,
      { token, version: existing.sys.version, body }
    );
    console.log(`Updated preview environment: ${saved.sys.id}`);
  } else {
    saved = await cma("POST", `/spaces/${spaceId}/preview_environments`, {
      token,
      body,
    });
    console.log(`Created preview environment: ${saved.sys.id}`);
  }

  console.log(`Name: ${PREVIEW_NAME}`);
  console.log(`Base: ${baseUrl}`);
  console.log(
    `Blog URL pattern: ${body.configurations.find((c) => c.contentType === "blogPost").url}`
  );
  console.log(`Open an entry → sidebar → Preview / Open preview`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
