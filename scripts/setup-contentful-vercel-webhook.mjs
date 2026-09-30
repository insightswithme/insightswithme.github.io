/**
 * Creates/updates Contentful webhook → Vercel Deploy Hook.
 *
 * Requires:
 *   CONTENTFUL_SPACE_ID
 *   CONTENTFUL_MANAGEMENT_TOKEN
 *   VERCEL_DEPLOY_HOOK_URL  — from: npx vercel deploy-hooks create contentful-publish --ref main
 *
 *   node scripts/setup-contentful-vercel-webhook.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const WEBHOOK_NAME = "Vercel redeploy";

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

function webhookDefinition(deployHookUrl) {
  return {
    name: WEBHOOK_NAME,
    url: deployHookUrl,
    httpBasicUsername: null,
    httpBasicPassword: null,
    headers: [
      {
        key: "User-Agent",
        value: "Contentful-Webhook-Vercel-Redeploy",
      },
    ],
    // Entry-only to avoid double deploys when publishing assets with a post.
    topics: ["Entry.publish", "Entry.unpublish", "Entry.delete"],
    filters: [],
    // Vercel Deploy Hooks ignore body; empty POST is enough.
    transformation: {
      method: "POST",
      contentType: "application/json",
      body: {},
    },
    active: true,
  };
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!spaceId || !cmaToken) {
    throw new Error("Need CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }
  if (!deployHookUrl) {
    throw new Error(
      "Need VERCEL_DEPLOY_HOOK_URL (npx vercel deploy-hooks create contentful-publish --ref main)"
    );
  }

  const list = await cma("GET", `/spaces/${spaceId}/webhook_definitions`, {
    token: cmaToken,
  });
  const existing = (list.items || []).find((w) => w.name === WEBHOOK_NAME);
  const body = webhookDefinition(deployHookUrl);

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
  console.log(`Calls: POST Vercel Deploy Hook`);
  console.log(
    `Manage: https://app.contentful.com/spaces/${spaceId}/settings/webhooks`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
