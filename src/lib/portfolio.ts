import fs from "fs";
import path from "path";
import { createClient } from "contentful";
import { isContentfulConfigured } from "@/lib/contentful";
import {
  portfolioBannerSeed,
  skillGroupSeeds,
  experienceSeeds,
  contributionSeeds,
  certificationSeeds,
  projectSeeds,
} from "@/lib/portfolioDefaults";

export type PortfolioRole = {
  date: string;
  title: string;
  description?: string;
};

export type PortfolioBanner = {
  title: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  intro: string;
  heroImageUrl: string;
  linkedinUrl: string;
  ctaLabel: string;
  skillsSectionTitle: string;
  experienceSectionTitle: string;
  experienceImageUrl: string;
  contributionsSectionTitle: string;
  awardsSectionTitle: string;
  projectsSectionTitle: string;
};

export type PortfolioSkillGroup = {
  name: string;
  skills: string[];
  order: number;
};

export type PortfolioExperience = {
  organization: string;
  roles: PortfolioRole[];
  order: number;
};

export type PortfolioContribution = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  ctaLabel: string;
  order: number;
  openInNewTab: boolean;
};

export type PortfolioCertification = {
  title: string;
  issuer: string;
  detail: string;
  kind: "certification" | "achievement";
  order: number;
};

export type PortfolioProject = {
  title: string;
  duration: string;
  description: string;
  order: number;
};

export type PortfolioData = {
  banner: PortfolioBanner;
  skillGroups: PortfolioSkillGroup[];
  experiences: PortfolioExperience[];
  contributions: PortfolioContribution[];
  certifications: PortfolioCertification[];
  projects: PortfolioProject[];
};

const GENERATED_PATH = path.join(
  process.cwd(),
  "content",
  "generated",
  "portfolio.json"
);

function defaultPortfolio(): PortfolioData {
  const bannerSeed = portfolioBannerSeed();
  return {
    banner: {
      title: "Portfolio",
      metaDescription:
        "Portfolio of Pawan Tyagi — Sitecore XM Cloud, .NET, certifications, experience, and projects.",
      ...bannerSeed,
    },
    skillGroups: skillGroupSeeds(),
    experiences: experienceSeeds(),
    contributions: contributionSeeds(),
    certifications: certificationSeeds(),
    projects: projectSeeds(),
  };
}

function readGenerated(): PortfolioData | null {
  if (!fs.existsSync(GENERATED_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(GENERATED_PATH, "utf8"));
    if (!data?.banner) return null;
    return {
      banner: data.banner,
      skillGroups: data.skillGroups || [],
      experiences: data.experiences || [],
      contributions: data.contributions || [],
      certifications: data.certifications || [],
      projects: data.projects || [],
    };
  } catch {
    return null;
  }
}

function parseExtras(body: unknown): Record<string, string> {
  if (typeof body !== "string" || !body.trim()) return {};
  try {
    return JSON.parse(body) as Record<string, string>;
  } catch {
    return {};
  }
}

async function fetchFromContentful(): Promise<PortfolioData | null> {
  if (!isContentfulConfigured()) return null;
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });

  const get = (content_type: string) =>
    client.getEntries({
      content_type,
      order: ["fields.order"],
      limit: 100,
    } as never);

  const [skills, experiences, contributions, certifications, projects, pages] =
    await Promise.all([
      get("portfolioSkillGroup"),
      get("portfolioExperience"),
      get("portfolioContribution"),
      get("portfolioCertification"),
      get("portfolioProject"),
      client.getEntries({
        content_type: "page",
        "fields.slug": "portfolio",
        limit: 1,
      } as never),
    ]);

  const defaults = defaultPortfolio();
  const page = pages.items[0];
  const f = (page?.fields || {}) as Record<string, unknown>;
  const extras = parseExtras(f.body);

  const banner: PortfolioBanner = {
    title: String(f.title || defaults.banner.title),
    metaDescription: String(f.metaDescription || defaults.banner.metaDescription),
    eyebrow: String(f.eyebrow || defaults.banner.eyebrow),
    headline: String(f.headline || defaults.banner.headline),
    intro: String(f.intro || defaults.banner.intro),
    heroImageUrl: String(f.heroImageUrl || defaults.banner.heroImageUrl),
    linkedinUrl: String(f.linkedinUrl || defaults.banner.linkedinUrl),
    ctaLabel: extras.ctaLabel || defaults.banner.ctaLabel,
    skillsSectionTitle:
      extras.skillsSectionTitle || defaults.banner.skillsSectionTitle,
    experienceSectionTitle:
      extras.experienceSectionTitle || defaults.banner.experienceSectionTitle,
    experienceImageUrl:
      extras.experienceImageUrl || defaults.banner.experienceImageUrl,
    contributionsSectionTitle:
      extras.contributionsSectionTitle ||
      defaults.banner.contributionsSectionTitle,
    awardsSectionTitle:
      extras.awardsSectionTitle || defaults.banner.awardsSectionTitle,
    projectsSectionTitle:
      extras.projectsSectionTitle || defaults.banner.projectsSectionTitle,
  };

  return {
    banner,
    skillGroups: skills.items.map((e, i) => {
      const fields = e.fields as Record<string, unknown>;
      return {
        name: String(fields.name || ""),
        skills: Array.isArray(fields.skills)
          ? fields.skills.filter((s): s is string => typeof s === "string")
          : [],
        order: typeof fields.order === "number" ? fields.order : i + 1,
      };
    }),
    experiences: experiences.items.map((e, i) => {
      const fields = e.fields as Record<string, unknown>;
      return {
        organization: String(fields.organization || ""),
        roles: Array.isArray(fields.roles)
          ? (fields.roles as PortfolioRole[])
          : [],
        order: typeof fields.order === "number" ? fields.order : i + 1,
      };
    }),
    contributions: contributions.items.map((e, i) => {
      const fields = e.fields as Record<string, unknown>;
      return {
        title: String(fields.title || ""),
        imageUrl: String(fields.imageUrl || ""),
        linkUrl: String(fields.linkUrl || ""),
        ctaLabel: String(fields.ctaLabel || "Visit"),
        order: typeof fields.order === "number" ? fields.order : i + 1,
        openInNewTab: Boolean(fields.openInNewTab),
      };
    }),
    certifications: certifications.items.map((e, i) => {
      const fields = e.fields as Record<string, unknown>;
      const kind =
        fields.kind === "achievement" ? "achievement" : "certification";
      return {
        title: String(fields.title || ""),
        issuer: String(fields.issuer || ""),
        detail: String(fields.detail || ""),
        kind,
        order: typeof fields.order === "number" ? fields.order : i + 1,
      };
    }),
    projects: projects.items.map((e, i) => {
      const fields = e.fields as Record<string, unknown>;
      return {
        title: String(fields.title || ""),
        duration: String(fields.duration || ""),
        description: String(fields.description || ""),
        order: typeof fields.order === "number" ? fields.order : i + 1,
      };
    }),
  };
}

export async function getPortfolioData(): Promise<PortfolioData> {
  try {
    const remote = await fetchFromContentful();
    if (
      remote &&
      (remote.skillGroups.length ||
        remote.experiences.length ||
        remote.projects.length)
    ) {
      return remote;
    }
  } catch (err) {
    console.warn("[portfolio] Contentful fetch failed", err);
  }

  return readGenerated() || defaultPortfolio();
}
