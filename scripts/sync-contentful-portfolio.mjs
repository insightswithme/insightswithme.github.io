/**
 * Creates portfolio Contentful types, seeds data (if empty), updates Page/portfolio
 * banner fields, and writes content/generated/portfolio.json.
 *
 *   node scripts/sync-contentful-portfolio.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  portfolioBannerSeed,
  skillGroupSeeds,
  experienceSeeds,
  contributionSeeds,
  certificationSeeds,
  projectSeeds,
} from "./portfolio-seeds.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "content", "generated");
const LOCALE = "en-US";

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
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: entry.sys.version }
  );
  return entry;
}

async function patchPagePortfolioBanner(spaceId, envId, token, banner) {
  const q = new URLSearchParams({
    content_type: "page",
    "fields.slug": "portfolio",
    limit: "1",
  });
  const found = await cma(
    "GET",
    `/spaces/${spaceId}/environments/${envId}/entries?${q}`,
    { token }
  );
  const entry = found.items?.[0];
  if (!entry) {
    console.warn("Page/portfolio not found — skip banner patch");
    return;
  }

  const fields = { ...entry.fields };
  // Only fill empty banner-related fields so we don't overwrite manual edits.
  const setIfEmpty = (id, value) => {
    const current = fields[id]?.[LOCALE];
    if (current == null || current === "") {
      fields[id] = { [LOCALE]: value };
    }
  };
  setIfEmpty("eyebrow", banner.eyebrow);
  setIfEmpty("headline", banner.headline);
  setIfEmpty("intro", banner.intro);
  setIfEmpty("heroImageUrl", banner.heroImageUrl);
  setIfEmpty("linkedinUrl", banner.linkedinUrl);
  // Store CTA + section titles in body as JSON sidecar if body empty
  if (!fields.body?.[LOCALE]) {
    fields.body = {
      [LOCALE]: JSON.stringify({
        ctaLabel: banner.ctaLabel,
        skillsSectionTitle: banner.skillsSectionTitle,
        experienceSectionTitle: banner.experienceSectionTitle,
        experienceImageUrl: banner.experienceImageUrl,
        contributionsSectionTitle: banner.contributionsSectionTitle,
        awardsSectionTitle: banner.awardsSectionTitle,
        projectsSectionTitle: banner.projectsSectionTitle,
      }),
    };
  }

  const updated = await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}`,
    { token, version: entry.sys.version, body: { fields } }
  );
  await cma(
    "PUT",
    `/spaces/${spaceId}/environments/${envId}/entries/${entry.sys.id}/published`,
    { token, version: updated.sys.version }
  );
  console.log("Patched Page/portfolio banner fields");
}

const TYPES = {
  portfolioSkillGroup: {
    name: "Portfolio Skill Group",
    displayField: "name",
    fields: [
      { id: "name", name: "Name", type: "Symbol", required: true, localized: false },
      {
        id: "skills",
        name: "Skills",
        type: "Array",
        required: false,
        localized: false,
        items: { type: "Symbol", validations: [{ size: { max: 128 } }] },
      },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
  portfolioExperience: {
    name: "Portfolio Experience",
    displayField: "organization",
    fields: [
      {
        id: "organization",
        name: "Organization",
        type: "Symbol",
        required: true,
        localized: false,
      },
      { id: "roles", name: "Roles", type: "Object", required: false, localized: false },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
  portfolioContribution: {
    name: "Portfolio Contribution",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      { id: "imageUrl", name: "Image URL", type: "Symbol", required: false, localized: false },
      { id: "linkUrl", name: "Link URL", type: "Symbol", required: false, localized: false },
      { id: "ctaLabel", name: "CTA Label", type: "Symbol", required: false, localized: false },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
      {
        id: "openInNewTab",
        name: "Open in new tab",
        type: "Boolean",
        required: false,
        localized: false,
      },
    ],
  },
  portfolioCertification: {
    name: "Portfolio Certification",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      { id: "issuer", name: "Issuer", type: "Symbol", required: false, localized: false },
      { id: "detail", name: "Detail", type: "Text", required: false, localized: false },
      {
        id: "kind",
        name: "Kind",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ in: ["certification", "achievement"] }],
      },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
  portfolioProject: {
    name: "Portfolio Project",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
      { id: "duration", name: "Duration", type: "Symbol", required: false, localized: false },
      { id: "description", name: "Description", type: "Text", required: false, localized: false },
      { id: "order", name: "Order", type: "Integer", required: false, localized: false },
    ],
  },
};

async function seedIfEmpty(spaceId, envId, token, contentType, items, toFields) {
  const existing = await listEntries(spaceId, envId, token, contentType);
  if (existing.length > 0) {
    console.log(`${contentType}: ${existing.length} exist — skip seed`);
    return;
  }
  console.log(`Seeding ${contentType}…`);
  for (const item of items) {
    await createAndPublish(spaceId, envId, token, contentType, toFields(item));
    console.log(`  + ${item.name || item.title || item.organization}`);
  }
}

async function fetchDelivery(spaceId, cdaToken, envId, contentType, order = "fields.order") {
  const { createClient } = await import("contentful");
  const client = createClient({
    space: spaceId,
    accessToken: cdaToken,
    environment: envId,
  });
  const res = await client.getEntries({
    content_type: contentType,
    order: [order],
    limit: 100,
  });
  return res.items;
}

function parseBannerExtras(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

async function main() {
  loadEnv();
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cmaToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const cdaToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const envId = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const banner = portfolioBannerSeed();

  let portfolio = {
    banner: {
      ...banner,
      title: "Portfolio",
      metaDescription:
        "Portfolio of Pawan Tyagi — Sitecore XM Cloud, .NET, certifications, experience, and projects.",
    },
    skillGroups: skillGroupSeeds(),
    experiences: experienceSeeds(),
    contributions: contributionSeeds(),
    certifications: certificationSeeds(),
    projects: projectSeeds(),
  };

  if (spaceId && cmaToken) {
    for (const [id, def] of Object.entries(TYPES)) {
      await ensureContentType(spaceId, envId, cmaToken, id, {
        name: def.name,
        description: def.name,
        displayField: def.displayField,
        fields: def.fields,
      });
    }

    await seedIfEmpty(
      spaceId,
      envId,
      cmaToken,
      "portfolioSkillGroup",
      skillGroupSeeds(),
      (g) => ({
        name: { [LOCALE]: g.name },
        skills: { [LOCALE]: g.skills },
        order: { [LOCALE]: g.order },
      })
    );
    await seedIfEmpty(
      spaceId,
      envId,
      cmaToken,
      "portfolioExperience",
      experienceSeeds(),
      (e) => ({
        organization: { [LOCALE]: e.organization },
        roles: { [LOCALE]: e.roles },
        order: { [LOCALE]: e.order },
      })
    );
    await seedIfEmpty(
      spaceId,
      envId,
      cmaToken,
      "portfolioContribution",
      contributionSeeds(),
      (c) => ({
        title: { [LOCALE]: c.title },
        imageUrl: { [LOCALE]: c.imageUrl },
        linkUrl: { [LOCALE]: c.linkUrl },
        ctaLabel: { [LOCALE]: c.ctaLabel },
        order: { [LOCALE]: c.order },
        openInNewTab: { [LOCALE]: Boolean(c.openInNewTab) },
      })
    );
    await seedIfEmpty(
      spaceId,
      envId,
      cmaToken,
      "portfolioCertification",
      certificationSeeds(),
      (c) => ({
        title: { [LOCALE]: c.title },
        issuer: { [LOCALE]: c.issuer || "" },
        detail: { [LOCALE]: c.detail || "" },
        kind: { [LOCALE]: c.kind },
        order: { [LOCALE]: c.order },
      })
    );
    await seedIfEmpty(
      spaceId,
      envId,
      cmaToken,
      "portfolioProject",
      projectSeeds(),
      (p) => ({
        title: { [LOCALE]: p.title },
        duration: { [LOCALE]: p.duration },
        description: { [LOCALE]: p.description },
        order: { [LOCALE]: p.order },
      })
    );

    await patchPagePortfolioBanner(spaceId, envId, cmaToken, banner);
  } else {
    console.warn("No CMA token — writing local portfolio seeds only.");
  }

  if (spaceId && cdaToken) {
    try {
      const [skills, experiences, contributions, certifications, projects, pages] =
        await Promise.all([
          fetchDelivery(spaceId, cdaToken, envId, "portfolioSkillGroup"),
          fetchDelivery(spaceId, cdaToken, envId, "portfolioExperience"),
          fetchDelivery(spaceId, cdaToken, envId, "portfolioContribution"),
          fetchDelivery(spaceId, cdaToken, envId, "portfolioCertification"),
          fetchDelivery(spaceId, cdaToken, envId, "portfolioProject"),
          fetchDelivery(spaceId, cdaToken, envId, "page", "sys.createdAt"),
        ]);

      const page = pages.find((p) => p.fields.slug === "portfolio");
      const extras = parseBannerExtras(page?.fields?.body);

      if (page) {
        portfolio.banner = {
          title: page.fields.title || "Portfolio",
          metaDescription: page.fields.metaDescription || "",
          eyebrow: page.fields.eyebrow || banner.eyebrow,
          headline: page.fields.headline || banner.headline,
          intro: page.fields.intro || banner.intro,
          heroImageUrl: page.fields.heroImageUrl || banner.heroImageUrl,
          linkedinUrl: page.fields.linkedinUrl || banner.linkedinUrl,
          ctaLabel: extras.ctaLabel || banner.ctaLabel,
          skillsSectionTitle:
            extras.skillsSectionTitle || banner.skillsSectionTitle,
          experienceSectionTitle:
            extras.experienceSectionTitle || banner.experienceSectionTitle,
          experienceImageUrl:
            extras.experienceImageUrl || banner.experienceImageUrl,
          contributionsSectionTitle:
            extras.contributionsSectionTitle ||
            banner.contributionsSectionTitle,
          awardsSectionTitle:
            extras.awardsSectionTitle || banner.awardsSectionTitle,
          projectsSectionTitle:
            extras.projectsSectionTitle || banner.projectsSectionTitle,
        };
      }

      if (skills.length) {
        portfolio.skillGroups = skills.map((e, i) => ({
          name: e.fields.name,
          skills: e.fields.skills || [],
          order: e.fields.order ?? i + 1,
        }));
      }
      if (experiences.length) {
        portfolio.experiences = experiences.map((e, i) => ({
          organization: e.fields.organization,
          roles: Array.isArray(e.fields.roles) ? e.fields.roles : [],
          order: e.fields.order ?? i + 1,
        }));
      }
      if (contributions.length) {
        portfolio.contributions = contributions.map((e, i) => ({
          title: e.fields.title,
          imageUrl: e.fields.imageUrl || "",
          linkUrl: e.fields.linkUrl || "",
          ctaLabel: e.fields.ctaLabel || "Visit",
          order: e.fields.order ?? i + 1,
          openInNewTab: Boolean(e.fields.openInNewTab),
        }));
      }
      if (certifications.length) {
        portfolio.certifications = certifications.map((e, i) => ({
          title: e.fields.title,
          issuer: e.fields.issuer || "",
          detail: e.fields.detail || "",
          kind: e.fields.kind || "certification",
          order: e.fields.order ?? i + 1,
        }));
      }
      if (projects.length) {
        portfolio.projects = projects.map((e, i) => ({
          title: e.fields.title,
          duration: e.fields.duration || "",
          description: e.fields.description || "",
          order: e.fields.order ?? i + 1,
        }));
      }
    } catch (err) {
      console.warn("Delivery fetch failed:", err.message || err);
    }
  }

  const sortByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
  portfolio.skillGroups.sort(sortByOrder);
  portfolio.experiences.sort(sortByOrder);
  portfolio.contributions.sort(sortByOrder);
  portfolio.certifications.sort(sortByOrder);
  portfolio.projects.sort(sortByOrder);

  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "portfolio.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), ...portfolio },
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
