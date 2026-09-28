/**
 * Creates the "Blog Post" content type in Contentful.
 *
 * Usage:
 *   npm run contentful:create-type
 *
 * Requires CONTENTFUL_SPACE_ID + CONTENTFUL_MANAGEMENT_TOKEN in .env.local
 * Create a Personal Access Token at:
 *   https://app.contentful.com/account/profile/cma_tokens
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");
loadEnvFiles(path.join(__dirname, ".."));

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "7csiqfkqfved";
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT || "master";
const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!TOKEN) {
  console.error(
    "Missing CONTENTFUL_MANAGEMENT_TOKEN.\n" +
      "Create one at https://app.contentful.com/account/profile/cma_tokens\n" +
      "Then run:\n" +
      "  $env:CONTENTFUL_MANAGEMENT_TOKEN='CFPAT-...'\n" +
      "  node scripts/create-contentful-blog-post-type.mjs"
  );
  process.exit(1);
}

const CONTENT_TYPE_ID = "blogPost";
const baseUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/content_types/${CONTENT_TYPE_ID}`;

const contentType = {
  name: "Blog Post",
  description:
    "Blog posts for Insights With Me — fields aligned with site frontmatter.",
  displayField: "title",
  fields: [
    {
      id: "title",
      name: "Title",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [{ size: { max: 256 } }],
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
          message: "Use lowercase letters, numbers, and hyphens only",
        },
      ],
    },
    {
      id: "excerpt",
      name: "Excerpt",
      type: "Text",
      required: false,
      localized: false,
    },
    {
      id: "description",
      name: "Description",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 256 } }],
    },
    {
      id: "metaDescription",
      name: "Meta Description",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 320 } }],
    },
    {
      id: "keywords",
      name: "Keywords",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 256 } }],
    },
    {
      id: "featuredImage",
      name: "Featured Image",
      type: "Link",
      linkType: "Asset",
      required: false,
      localized: false,
      validations: [{ linkMimetypeGroup: ["image"] }],
    },
    {
      id: "featuredImageUrl",
      name: "Featured Image URL",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 512 } }],
    },
    {
      id: "date",
      name: "Date",
      type: "Date",
      required: true,
      localized: false,
    },
    {
      id: "modifiedDate",
      name: "Modified Date",
      type: "Date",
      required: false,
      localized: false,
    },
    {
      id: "tags",
      name: "Tags",
      type: "Array",
      required: false,
      localized: false,
      items: {
        type: "Symbol",
        validations: [{ size: { max: 64 } }],
      },
    },
    {
      id: "author",
      name: "Author",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 128 } }],
    },
    {
      id: "body",
      name: "Body",
      type: "Text",
      required: true,
      localized: false,
    },
    {
      id: "featured",
      name: "Featured",
      type: "Boolean",
      required: false,
      localized: false,
    },
    {
      id: "faq",
      name: "FAQ",
      type: "Object",
      required: false,
      localized: false,
    },
    {
      id: "howto",
      name: "How To",
      type: "Object",
      required: false,
      localized: false,
    },
  ],
};

async function request(method, url, body, version) {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/vnd.contentful.management.v1+json",
  };
  if (version != null) headers["X-Contentful-Version"] = String(version);

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.sys?.id || res.statusText;
    const details = JSON.stringify(data, null, 2);
    throw new Error(`${method} ${url} failed (${res.status}): ${msg}\n${details}`);
  }
  return data;
}

async function main() {
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENVIRONMENT_ID}`);
  console.log(`Content type: ${CONTENT_TYPE_ID}`);

  let existing = null;
  try {
    existing = await request("GET", baseUrl);
    console.log(`Updating existing content type (version ${existing.sys.version})...`);
  } catch (err) {
    if (!String(err.message).includes("(404)")) throw err;
    console.log("Creating new content type...");
  }

  const version = existing?.sys?.version;
  const saved = await request(
    existing ? "PUT" : "PUT",
    baseUrl,
    contentType,
    version
  );

  console.log(`Saved content type (version ${saved.sys.version}). Publishing...`);

  const published = await request(
    "PUT",
    `${baseUrl}/published`,
    null,
    saved.sys.version
  );

  console.log("Published Blog Post content type.");
  console.log(
    `Open: https://app.contentful.com/spaces/${SPACE_ID}/content_types/${CONTENT_TYPE_ID}/fields`
  );
  console.log(`Display field: ${published.displayField}`);
  console.log(`Fields: ${published.fields.map((f) => f.id).join(", ")}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
