/**
 * Ensures Contentful `siteFooter` content type, seeds one entry if missing,
 * and writes content/generated/footer.json for Layout / SiteFooter.
 *
 *   node scripts/sync-contentful-footer.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "content", "generated");
const LOCALE = "en-US";
const CONTENT_TYPE = "siteFooter";

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

function footerSeed() {
  return {
    name: "Site Footer",
    aboutTitle: "About Pawan",
    aboutText:
      "Technical Lead at Altudo (Gurugram). Sitecore XM Cloud & 10 .NET certified, Azure AZ-204. Passionate about sharing Sitecore knowledge through blogging and community engagement.",
    pagesTitle: "Important Pages",
    legalTitle: "Legal & Info",
    connectTitle: "Connect with Me",
    copyrightText: "© {{year}} Pawan Tyagi. All rights reserved.",
    copyrightSuffix: "Built with passion for sharing knowledge",
    linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
    githubUrl: "https://github.com/pawan-tyagi",
    slackUrl: "https://sitecorechat.slack.com/team/U066H8NTN6N",
    stackExchangeUrl: "https://sitecore.stackexchange.com",
    twitterUrl: "",
  };
}

async function ensureContentType(spaceId, envId, token) {
  const definition = {
    name: "Site Footer",
    description: "Footer copy, copyright, and social links",
    displayField: "name",
    fields: [
      { id: "name", name: "Name", type: "Symbol", required: true, localized: false },
      { id: "aboutTitle", name: "About Title", type: "Symbol", required: false, localized: false },
      { id: "aboutText", name: "About Text", type: "Text", required: false, localized: false },
      { id: "pagesTitle", name: "Pages Title", type: "Symbol", required: false, localized: false },
      { id: "legalTitle", name: "Legal Title", type: "Symbol", required: false, localized: false },
      { id: "connectTitle", name: "Connect Title", type: "Symbol", required: false, localized: false },
      {
        id: "copyrightText",
        name: "Copyright Text",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 256 } }],
      },
      {
        id: "copyrightSuffix",
        name: "Copyright Suffix",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 256 } }],
      },
      { id: "linkedinUrl", name: "LinkedIn URL", type: "Symbol", required: false, localized: false },
      { id: "githubUrl", name: "GitHub URL", type: "Symbol", required: false, localized: false },
      { id: "slackUrl", name: "Slack URL", type: "Symbol", required: false, localized: false },
      {
        id: "stackExchangeUrl",
        name: "Stack Exchange URL",
        type: "Symbol",
        required: false,
        localized: false,
      },
      { id: "twitterUrl", name: "Twitter URL", type: "Symbol", required: false, localized: false },
    ],
  };

  let existing = null;
  try {
    existing = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}`,
      { token }
    );
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}`,
    { token, version: existing?.sys?.version, body: definition }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${CONTENT_TYPE}/published`,
    { token, version: saved.sys.version }
  );
  console.log(`Content type ready: ${CONTENT_TYPE}`);
}

function toFields(seed) {
  const fields = {};
  for (const [key, value] of Object.entries(seed)) {
    fields[key] = { [LOCALE]: value ?? "" };
  }
  return fields;
}

async function ensureEntry(spaceId, envId, token, seed) {
  const q = new URLSearchParams({
    content_type: CONTENT_TYPE,
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );

  if (found.items?.[0]) {
    console.log("Site Footer entry exists — skip seed");
    return found.items[0];
  }

  const entry = await cma(
    "POST",
    `/spaces/${spaceId}/environments/${envId}/entries`,
    { token, body: { fields: toFields(seed) }, contentTypeId: CONTENT_TYPE }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: entry.sys.version }
  );
  console.log("Created + published Site Footer entry");
  return entry;
}

function mapFields(fields) {
  const g = (id, fallback = "") => {
    const v = fields?.[id]?.[LOCALE] ?? fields?.[id];
    return v == null || v === "" ? fallback : String(v);
  };
  const seed = footerSeed();
  return {
    name: g("name", seed.name),
    aboutTitle: g("aboutTitle", seed.aboutTitle),
    aboutText: g("aboutText", seed.aboutText),
    pagesTitle: g("pagesTitle", seed.pagesTitle),
    legalTitle: g("legalTitle", seed.legalTitle),
    connectTitle: g("connectTitle", seed.connectTitle),
    copyrightText: g("copyrightText", seed.copyrightText),
    copyrightSuffix: g("copyrightSuffix", seed.copyrightSuffix),
    linkedinUrl: g("linkedinUrl", seed.linkedinUrl),
    githubUrl: g("githubUrl", seed.githubUrl),
    slackUrl: g("slackUrl", seed.slackUrl),
    stackExchangeUrl: g("stackExchangeUrl", seed.stackExchangeUrl),
    twitterUrl: g("twitterUrl", seed.twitterUrl),
  };
}

async function fetchFooter(spaceId, cdaToken, envId) {
  const { createClient } = await import("contentful");
  const client = createClient({
    space: spaceId,
    accessToken: cdaToken,
    environment: envId,
  });
  const res = await client.getEntries({
    content_type: CONTENT_TYPE,
    limit: 1,
  });
  if (!res.items[0]) return null;
  return mapFields(res.items[0].fields);
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const cdaToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const seed = footerSeed();
  let footer = seed;

  if (spaceId && cmaToken) {
    await ensureContentType(spaceId, envId, cmaToken);
    await ensureEntry(spaceId, envId, cmaToken, seed);
  } else {
    console.warn("No CMA token — writing local footer seed only.");
  }

  if (spaceId && cdaToken) {
    try {
      const remote = await fetchFooter(spaceId, cdaToken, envId);
      if (remote) footer = remote;
    } catch (err) {
      console.warn("Delivery fetch failed:", err.message || err);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "footer.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), ...footer },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
