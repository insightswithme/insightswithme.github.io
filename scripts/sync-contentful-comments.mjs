/**
 * Ensures Contentful `blogComment` type and `blogPost.commentsEnabled`.
 *
 *   node scripts/sync-contentful-comments.mjs
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");
loadEnvFiles(root);

const COMMENT_TYPE = "blogComment";
const POST_TYPE = "blogPost";

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

async function ensureCommentType(spaceId, envId, token) {
  const definition = {
    name: "Blog Comment",
    description:
      "Reader comments on a blog post. Publish an entry to show it on the site.",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ size: { max: 80 } }],
      },
      {
        id: "body",
        name: "Comment",
        type: "Text",
        required: true,
        localized: false,
        validations: [{ size: { max: 4000 } }],
      },
      {
        id: "postSlug",
        name: "Post slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [
          {
            regexp: {
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              flags: null,
            },
          },
        ],
      },
    ],
  };

  let existing = null;
  try {
    existing = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/content_types/${COMMENT_TYPE}`,
      { token }
    );
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${COMMENT_TYPE}`,
    { token, version: existing?.sys?.version, body: definition }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${COMMENT_TYPE}/published`,
    { token, version: saved.sys.version }
  );
  console.log(`Content type ready: ${COMMENT_TYPE}`);
}

async function ensurePostCommentsField(spaceId, envId, token) {
  const type = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/content_types/${POST_TYPE}`,
    { token }
  );
  const fields = Array.isArray(type.fields) ? [...type.fields] : [];
  if (fields.some((f) => f.id === "commentsEnabled")) {
    console.log("blogPost.commentsEnabled already present");
    return;
  }
  fields.push({
    id: "commentsEnabled",
    name: "Comments enabled",
    type: "Boolean",
    required: false,
    localized: false,
  });
  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${POST_TYPE}`,
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
    `/spaces/${spaceId}/environments/${envId}/content_types/${POST_TYPE}/published`,
    { token, version: saved.sys.version }
  );
  console.log("Added blogPost.commentsEnabled (default on when empty)");
}

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  if (!spaceId || !token) {
    console.warn("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
    return;
  }
  if (process.env.GITHUB_ACTIONS) {
    console.log("CI: skipping Contentful CMA writes for comments type");
    return;
  }
  await ensureCommentType(spaceId, envId, token);
  await ensurePostCommentsField(spaceId, envId, token);
  console.log(
    `Comments: https://app.contentful.com/spaces/${spaceId}/content_types/${COMMENT_TYPE}`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
