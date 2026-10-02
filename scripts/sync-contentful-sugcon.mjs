/**
 * SUGCON Contentful bootstrap + build snapshot.
 *
 * - Ensures content types (sugconPage, communityConnection, communityInsight, communityMoment)
 * - Seeds entries ONLY when empty (never overwrites editor changes)
 * - Links Media Assets when missing
 * - Writes content/generated/sugcon.json from Delivery API only
 *
 *   node scripts/sync-contentful-sugcon.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  sugconPageSeed,
  connectionSeeds,
  insightSeeds,
  momentSeeds,
} from "./sugcon-seeds.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const outDir = path.join(root, "content", "generated");
const LOCALE = "en-US";

const ASSET_IMAGE = {
  type: "Link",
  linkType: "Asset",
  validations: [{ linkMimetypeGroup: ["image"] }],
  required: false,
  localized: false,
};

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
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("//")) return null;
  const absolute = path.join(publicDir, imagePath.replace(/^\//, ""));
  return fs.existsSync(absolute) ? absolute : null;
}

function assetLink(id) {
  return { sys: { type: "Link", linkType: "Asset", id } };
}

function resolveAssetUrl(asset) {
  const url = asset?.fields?.file?.url || asset?.fields?.file?.[LOCALE]?.url;
  if (!url || typeof url !== "string") return "";
  return url.startsWith("//") ? `https:${url}` : url;
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

async function ensureContentType(spaceId, envId, token, id, definition) {
  let existing = null;
  try {
    existing = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/content_types/${id}`,
      { token }
    );
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const saved = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${id}`,
    { token, version: existing?.sys?.version, body: definition }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/content_types/${id}/published`,
    { token, version: saved.sys.version }
  );
  console.log(`Content type ready: ${id}`);
}

async function listEntries(spaceId, envId, token, contentType) {
  const items = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const q = new URLSearchParams({
      content_type: contentType,
      limit: "100",
      skip: String(skip),
    });
    const page = await cma(
      "GET",
      `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
      { token }
    );
    total = page.total;
    items.push(...page.items);
    skip += page.items.length;
    if (!page.items.length) break;
  }
  return items;
}

async function createAndPublish(spaceId, envId, token, contentType, fields) {
  const entry = await cma(
    "POST",
    `/spaces/${spaceId}/environments/${envId}/entries`,
    { token, body: { fields }, contentTypeId: contentType }
  );
  return cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: entry.sys.version }
  );
}

async function updateAndPublish(spaceId, envId, token, entry, fields) {
  const updated = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
    { token, version: entry.sys.version, body: { fields } }
  );
  return cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: updated.sys.version }
  );
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
        description: { [LOCALE]: `SUGCON media (${fileName})` },
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

async function ensureAsset(spaceId, envId, token, imageRef, cache) {
  if (!imageRef) return null;
  if (cache.has(imageRef)) return cache.get(imageRef);
  const absolute = localPathFromRef(imageRef);
  if (!absolute) {
    cache.set(imageRef, null);
    return null;
  }
  const asset = await uploadLocalImage(spaceId, envId, token, absolute);
  cache.set(imageRef, asset);
  console.log(`  asset ${path.basename(absolute)} → ${asset.sys.id}`);
  return asset;
}

async function ensureNavItem(spaceId, envId, token) {
  const q = new URLSearchParams({
    content_type: "navigationItem",
    "fields.href": "/sugcon",
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  if (found.items?.[0]) {
    console.log("Nav item exists (skip): /sugcon");
    return;
  }
  const fields = {
    label: { [LOCALE]: "SUGCON" },
    href: { [LOCALE]: "/sugcon" },
    order: { [LOCALE]: 5 },
    location: { [LOCALE]: "header" },
  };
  await createAndPublish(spaceId, envId, token, "navigationItem", fields);
  console.log("Created + published nav: SUGCON");
}

const TYPES = {
  sugconPage: {
    name: "SUGCON Page",
    description:
      "All SUGCON page copy and hero image. Edit here — nothing is hardcoded in the site.",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      {
        id: "metaDescription",
        name: "Meta Description",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [{ size: { max: 320 } }],
      },
      { id: "eyebrow", name: "Eyebrow", type: "Symbol", required: false, localized: false },
      { id: "headline", name: "Headline", type: "Symbol", required: false, localized: false },
      { id: "intro", name: "Intro", type: "Text", required: false, localized: false },
      { id: "ctaLabel", name: "CTA Label", type: "Symbol", required: false, localized: false },
      {
        id: "linkedinUrl",
        name: "LinkedIn URL",
        type: "Symbol",
        required: false,
        localized: false,
      },
      { id: "heroImage", name: "Hero Image", ...ASSET_IMAGE },
      {
        id: "peopleKicker",
        name: "People Kicker",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "peopleTitle",
        name: "People Title",
        type: "Symbol",
        required: false,
        localized: false,
      },
      { id: "peopleLede", name: "People Lede", type: "Text", required: false, localized: false },
      {
        id: "insightsKicker",
        name: "Insights Kicker",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "insightsTitle",
        name: "Insights Title",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "insightsLede",
        name: "Insights Lede",
        type: "Text",
        required: false,
        localized: false,
      },
      {
        id: "momentsKicker",
        name: "Moments Kicker",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "momentsTitle",
        name: "Moments Title",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "momentsLede",
        name: "Moments Lede",
        type: "Text",
        required: false,
        localized: false,
      },
    ],
  },
  communityConnection: {
    name: "Community Connection",
    description: "Person / relationship on the SUGCON page. Photo & gallery via Media.",
    displayField: "name",
    fields: [
      { id: "name", name: "Name", type: "Symbol", required: true, localized: false },
      { id: "role", name: "Role", type: "Symbol", required: false, localized: false },
      { id: "company", name: "Company", type: "Symbol", required: false, localized: false },
      { id: "eventName", name: "Event Name", type: "Symbol", required: false, localized: false },
      { id: "eventYear", name: "Event Year", type: "Symbol", required: false, localized: false },
      {
        id: "connectionNote",
        name: "Connection Note",
        type: "Text",
        required: false,
        localized: false,
      },
      { id: "photo", name: "Photo", ...ASSET_IMAGE },
      {
        id: "photoUrl",
        name: "Photo URL (unused — prefer Photo)",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "gallery",
        name: "Gallery",
        type: "Array",
        required: false,
        localized: false,
        items: {
          type: "Link",
          linkType: "Asset",
          validations: [{ linkMimetypeGroup: ["image"] }],
        },
      },
      {
        id: "galleryUrls",
        name: "Gallery URLs (unused — prefer Gallery)",
        type: "Array",
        required: false,
        localized: false,
        items: { type: "Symbol" },
      },
      { id: "featured", name: "Featured", type: "Boolean", required: false, localized: false },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
  communityInsight: {
    name: "Community Insight",
    description: "Conversation starter / takeaway. Image via Media.",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      { id: "summary", name: "Summary", type: "Symbol", required: false, localized: false },
      { id: "detail", name: "Detail", type: "Text", required: false, localized: false },
      { id: "image", name: "Image", ...ASSET_IMAGE },
      {
        id: "imageUrl",
        name: "Image URL (unused — prefer Image)",
        type: "Symbol",
        required: false,
        localized: false,
      },
      { id: "eventName", name: "Event Name", type: "Symbol", required: false, localized: false },
      { id: "eventYear", name: "Event Year", type: "Symbol", required: false, localized: false },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
  communityMoment: {
    name: "Community Moment",
    description: "Gallery moment. Image via Media.",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      { id: "caption", name: "Caption", type: "Text", required: false, localized: false },
      { id: "image", name: "Image", ...ASSET_IMAGE },
      {
        id: "imageUrl",
        name: "Image URL (unused — prefer Image)",
        type: "Symbol",
        required: false,
        localized: false,
      },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
};

function emptySugconData() {
  return {
    banner: {
      title: "",
      metaDescription: "",
      eyebrow: "",
      headline: "",
      intro: "",
      heroImageUrl: "",
      linkedinUrl: "",
      sections: {
        ctaLabel: "",
        peopleKicker: "",
        peopleTitle: "",
        peopleLede: "",
        insightsKicker: "",
        insightsTitle: "",
        insightsLede: "",
        momentsKicker: "",
        momentsTitle: "",
        momentsLede: "",
      },
    },
    connections: [],
    insights: [],
    moments: [],
  };
}

function mapFromDelivery(page, connections, insights, moments) {
  const data = emptySugconData();
  if (page) {
    const f = page.fields;
    data.banner = {
      title: f.title || "",
      metaDescription: f.metaDescription || "",
      eyebrow: f.eyebrow || "",
      headline: f.headline || "",
      intro: f.intro || "",
      heroImageUrl: resolveAssetUrl(f.heroImage),
      linkedinUrl: f.linkedinUrl || "",
      sections: {
        ctaLabel: f.ctaLabel || "",
        peopleKicker: f.peopleKicker || "",
        peopleTitle: f.peopleTitle || "",
        peopleLede: f.peopleLede || "",
        insightsKicker: f.insightsKicker || "",
        insightsTitle: f.insightsTitle || "",
        insightsLede: f.insightsLede || "",
        momentsKicker: f.momentsKicker || "",
        momentsTitle: f.momentsTitle || "",
        momentsLede: f.momentsLede || "",
      },
    };
  }
  data.connections = (connections || []).map((e) => ({
    name: e.fields.name || "",
    role: e.fields.role || "",
    company: e.fields.company || "",
    eventName: e.fields.eventName || "",
    eventYear: e.fields.eventYear || "",
    connectionNote: e.fields.connectionNote || "",
    photoUrl: resolveAssetUrl(e.fields.photo),
    galleryUrls: Array.isArray(e.fields.gallery)
      ? e.fields.gallery.map(resolveAssetUrl).filter(Boolean)
      : [],
    featured: Boolean(e.fields.featured),
    order: e.fields.order ?? 0,
  }));
  data.insights = (insights || []).map((e) => ({
    title: e.fields.title || "",
    summary: e.fields.summary || "",
    detail: e.fields.detail || "",
    imageUrl: resolveAssetUrl(e.fields.image),
    eventName: e.fields.eventName || "",
    eventYear: e.fields.eventYear || "",
    order: e.fields.order ?? 0,
  }));
  data.moments = (moments || []).map((e) => ({
    title: e.fields.title || "",
    caption: e.fields.caption || "",
    imageUrl: resolveAssetUrl(e.fields.image),
    order: e.fields.order ?? 0,
  }));
  return data;
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const cdaToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const assetCache = new Map();
  let data = emptySugconData();

  if (spaceId && cmaToken && !process.env.GITHUB_ACTIONS) {
    for (const [id, def] of Object.entries(TYPES)) {
      await ensureContentType(spaceId, envId, cmaToken, id, {
        name: def.name,
        description: def.description,
        displayField: def.displayField,
        fields: def.fields,
      });
    }

    const pageSeed = sugconPageSeed();
    const existingPages = await listEntries(spaceId, envId, cmaToken, "sugconPage");
    if (existingPages.length === 0) {
      console.log("Seeding sugconPage…");
      const hero = await ensureAsset(
        spaceId,
        envId,
        cmaToken,
        pageSeed.heroLocalPath,
        assetCache
      );
      const fields = {
        title: { [LOCALE]: pageSeed.title },
        metaDescription: { [LOCALE]: pageSeed.metaDescription },
        eyebrow: { [LOCALE]: pageSeed.eyebrow },
        headline: { [LOCALE]: pageSeed.headline },
        intro: { [LOCALE]: pageSeed.intro },
        ctaLabel: { [LOCALE]: pageSeed.ctaLabel },
        linkedinUrl: { [LOCALE]: pageSeed.linkedinUrl },
        peopleKicker: { [LOCALE]: pageSeed.peopleKicker },
        peopleTitle: { [LOCALE]: pageSeed.peopleTitle },
        peopleLede: { [LOCALE]: pageSeed.peopleLede },
        insightsKicker: { [LOCALE]: pageSeed.insightsKicker },
        insightsTitle: { [LOCALE]: pageSeed.insightsTitle },
        insightsLede: { [LOCALE]: pageSeed.insightsLede },
        momentsKicker: { [LOCALE]: pageSeed.momentsKicker },
        momentsTitle: { [LOCALE]: pageSeed.momentsTitle },
        momentsLede: { [LOCALE]: pageSeed.momentsLede },
      };
      if (hero) fields.heroImage = { [LOCALE]: assetLink(hero.sys.id) };
      await createAndPublish(spaceId, envId, cmaToken, "sugconPage", fields);
    } else {
      console.log(`sugconPage: ${existingPages.length} exist — skip text seed`);
      const entry = existingPages[0];
      if (!entry.fields?.heroImage?.[LOCALE]?.sys?.id) {
        const hero = await ensureAsset(
          spaceId,
          envId,
          cmaToken,
          pageSeed.heroLocalPath,
          assetCache
        );
        if (hero) {
          const fields = { ...entry.fields };
          fields.heroImage = { [LOCALE]: assetLink(hero.sys.id) };
          await updateAndPublish(spaceId, envId, cmaToken, entry, fields);
          console.log("  linked missing heroImage on sugconPage");
        }
      }
    }

    const existingConnections = await listEntries(
      spaceId,
      envId,
      cmaToken,
      "communityConnection"
    );
    if (existingConnections.length === 0) {
      console.log("Seeding communityConnection…");
      for (const c of connectionSeeds()) {
        const photo = await ensureAsset(
          spaceId,
          envId,
          cmaToken,
          c.photoLocalPath,
          assetCache
        );
        const gallery = [];
        for (const p of c.galleryLocalPaths || []) {
          const a = await ensureAsset(spaceId, envId, cmaToken, p, assetCache);
          if (a) gallery.push(assetLink(a.sys.id));
        }
        const fields = {
          name: { [LOCALE]: c.name },
          role: { [LOCALE]: c.role || "" },
          company: { [LOCALE]: c.company || "" },
          eventName: { [LOCALE]: c.eventName || "" },
          eventYear: { [LOCALE]: c.eventYear || "" },
          connectionNote: { [LOCALE]: c.connectionNote || "" },
          featured: { [LOCALE]: Boolean(c.featured) },
          order: { [LOCALE]: c.order },
        };
        if (photo) fields.photo = { [LOCALE]: assetLink(photo.sys.id) };
        if (gallery.length) fields.gallery = { [LOCALE]: gallery };
        await createAndPublish(spaceId, envId, cmaToken, "communityConnection", fields);
        console.log(`  + ${c.name}`);
      }
    } else {
      console.log(
        `communityConnection: ${existingConnections.length} exist — skip seed (Contentful is source of truth)`
      );
    }

    const existingInsights = await listEntries(
      spaceId,
      envId,
      cmaToken,
      "communityInsight"
    );
    if (existingInsights.length === 0) {
      console.log("Seeding communityInsight…");
      for (const i of insightSeeds()) {
        const image = await ensureAsset(
          spaceId,
          envId,
          cmaToken,
          i.imageLocalPath,
          assetCache
        );
        const fields = {
          title: { [LOCALE]: i.title },
          summary: { [LOCALE]: i.summary || "" },
          detail: { [LOCALE]: i.detail || "" },
          eventName: { [LOCALE]: i.eventName || "" },
          eventYear: { [LOCALE]: i.eventYear || "" },
          order: { [LOCALE]: i.order },
        };
        if (image) fields.image = { [LOCALE]: assetLink(image.sys.id) };
        await createAndPublish(spaceId, envId, cmaToken, "communityInsight", fields);
        console.log(`  + ${i.title}`);
      }
    } else {
      console.log(
        `communityInsight: ${existingInsights.length} exist — skip seed`
      );
    }

    const existingMoments = await listEntries(
      spaceId,
      envId,
      cmaToken,
      "communityMoment"
    );
    if (existingMoments.length === 0) {
      console.log("Seeding communityMoment…");
      for (const m of momentSeeds()) {
        const image = await ensureAsset(
          spaceId,
          envId,
          cmaToken,
          m.imageLocalPath,
          assetCache
        );
        const fields = {
          title: { [LOCALE]: m.title },
          caption: { [LOCALE]: m.caption || "" },
          order: { [LOCALE]: m.order },
        };
        if (image) fields.image = { [LOCALE]: assetLink(image.sys.id) };
        await createAndPublish(spaceId, envId, cmaToken, "communityMoment", fields);
        console.log(`  + ${m.title}`);
      }
    } else {
      console.log(`communityMoment: ${existingMoments.length} exist — skip seed`);
    }

    try {
      await ensureNavItem(spaceId, envId, cmaToken);
    } catch (err) {
      console.warn("Nav ensure skipped:", err.message || err);
    }
  } else if (process.env.GITHUB_ACTIONS) {
    console.log("CI: skipping Contentful CMA writes (Delivery API only)");
  } else {
    console.warn("No CMA token — Delivery API snapshot only.");
  }

  if (spaceId && cdaToken) {
    try {
      const { createClient } = await import("contentful");
      const client = createClient({
        space: spaceId,
        accessToken: cdaToken,
        environment: envId,
      });
      const [pagesRes, connectionsRes, insightsRes, momentsRes] =
        await Promise.all([
          client.getEntries({
            content_type: "sugconPage",
            include: 2,
            limit: 1,
          }),
          client.getEntries({
            content_type: "communityConnection",
            order: ["fields.order"],
            include: 2,
            limit: 100,
          }),
          client.getEntries({
            content_type: "communityInsight",
            order: ["fields.order"],
            include: 2,
            limit: 100,
          }),
          client.getEntries({
            content_type: "communityMoment",
            order: ["fields.order"],
            include: 2,
            limit: 100,
          }),
        ]);
      data = mapFromDelivery(
        pagesRes.items[0],
        connectionsRes.items,
        insightsRes.items,
        momentsRes.items
      );
    } catch (err) {
      console.warn("Delivery fetch failed:", err.message || err);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "sugcon.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), ...data },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote ${outPath} (Contentful snapshot only)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
