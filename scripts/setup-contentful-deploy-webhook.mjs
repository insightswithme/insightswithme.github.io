/**
 * Creates/updates a Contentful webhook that triggers GitHub Actions
 * via repository_dispatch (event_type: contentful-publish).
 *
 * Requires:
 *   CONTENTFUL_SPACE_ID
 *   CONTENTFUL_MANAGEMENT_TOKEN
 *   GITHUB_DISPATCH_TOKEN  — GitHub token with `repo` scope (PAT or `gh auth token`)
 *
 *   node scripts/setup-contentful-deploy-webhook.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const WEBHOOK_NAME = "GitHub Pages redeploy";
const REPO = "insightswithme/insightswithme.github.io";
const EVENT_TYPE = "contentful-publish";

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

function webhookDefinition(githubToken) {
  return {
    name: WEBHOOK_NAME,
    url: `https://api.github.com/repos/${REPO}/dispatches`,
    httpBasicUsername: null,
    httpBasicPassword: null,
    headers: [
      { key: "Accept", value: "application/vnd.github+json" },
      { key: "Authorization", value: `Bearer ${githubToken}` },
      { key: "X-GitHub-Api-Version", value: "2022-11-28" },
      {
        key: "User-Agent",
        value: "Contentful-Webhook-GitHubPages-Redeploy",
      },
    ],
    // Entry-only: publishing a post with an image also fires Asset.publish,
    // which would start a second identical deploy.
    topics: ["Entry.publish", "Entry.unpublish", "Entry.delete"],
    filters: [],
    // body must be a JSON object (not a string). A string body is sent as a
    // JSON string and GitHub returns 422 "is not an object".
    transformation: {
      method: "POST",
      contentType: "application/json",
      body: {
        event_type: EVENT_TYPE,
        client_payload: { source: "contentful" },
      },
    },
    active: true,
  };
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

  if (!spaceId || !cmaToken) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }

  const list = await cma("GET", `/spaces/${spaceId}/webhook_definitions`, {
    token: cmaToken,
  });
  const existing = (list.items || []).find((w) => w.name === WEBHOOK_NAME);

  const existingAuth = (existing?.headers || []).find(
    (h) => h.key?.toLowerCase() === "authorization"
  )?.value;
  const existingToken = existingAuth?.replace(/^Bearer\s+/i, "")?.trim();

  const githubToken =
    process.env.GITHUB_DISPATCH_TOKEN ||
    process.env.GH_TOKEN ||
    existingToken;

  if (!githubToken) {
    throw new Error(
      "Need GITHUB_DISPATCH_TOKEN (GitHub PAT with repo scope) or GH_TOKEN"
    );
  }

  const body = webhookDefinition(githubToken);

  let saved;
  if (existing) {
    saved = await cma(
      "PUT",
      `/spaces/${spaceId}/webhook_definitions/${existing.sys.id}`,
      { token: cmaToken, version: existing.sys.version, body }
    );
    console.log(`Updated webhook: ${saved.sys.id}`);
  } else {
    saved = await cma("POST", `/spaces/${spaceId}/webhook_definitions`, {
      token: cmaToken,
      body,
    });
    console.log(`Created webhook: ${saved.sys.id}`);
  }

  console.log(`Name: ${WEBHOOK_NAME}`);
  console.log(`Triggers: ${body.topics.join(", ")}`);
  console.log(`Calls: POST /repos/${REPO}/dispatches (${EVENT_TYPE})`);
  console.log(
    `Manage: https://app.contentful.com/spaces/${spaceId}/settings/webhooks`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
