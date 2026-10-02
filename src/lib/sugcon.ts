import fs from "fs";
import path from "path";
import { createClient, type Asset, type Entry } from "contentful";
import { assetUrl, isContentfulConfigured } from "@/lib/contentful";

export type SugconSections = {
  ctaLabel: string;
  peopleKicker: string;
  peopleTitle: string;
  peopleLede: string;
  insightsKicker: string;
  insightsTitle: string;
  insightsLede: string;
  momentsKicker: string;
  momentsTitle: string;
  momentsLede: string;
};

export type SugconBanner = {
  title: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  intro: string;
  heroImageUrl: string;
  linkedinUrl: string;
  sections: SugconSections;
};

export type CommunityConnection = {
  name: string;
  role: string;
  company: string;
  eventName: string;
  eventYear: string;
  connectionNote: string;
  photoUrl: string;
  galleryUrls: string[];
  featured: boolean;
  order: number;
};

export type CommunityInsight = {
  title: string;
  summary: string;
  detail: string;
  imageUrl: string;
  eventName: string;
  eventYear: string;
  order: number;
};

export type CommunityMoment = {
  title: string;
  caption: string;
  imageUrl: string;
  order: number;
};

export type SugconData = {
  banner: SugconBanner;
  connections: CommunityConnection[];
  insights: CommunityInsight[];
  moments: CommunityMoment[];
};

const GENERATED_PATH = path.join(
  process.cwd(),
  "content",
  "generated",
  "sugcon.json"
);

const EMPTY_SECTIONS: SugconSections = {
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
};

function emptyData(): SugconData {
  return {
    banner: {
      title: "",
      metaDescription: "",
      eyebrow: "",
      headline: "",
      intro: "",
      heroImageUrl: "",
      linkedinUrl: "",
      sections: { ...EMPTY_SECTIONS },
    },
    connections: [],
    insights: [],
    moments: [],
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mapPageFields(f: Record<string, unknown>): SugconBanner {
  return {
    title: str(f.title),
    metaDescription: str(f.metaDescription),
    eyebrow: str(f.eyebrow),
    headline: str(f.headline),
    intro: str(f.intro),
    heroImageUrl: assetUrl(f.heroImage as Asset | undefined),
    linkedinUrl: str(f.linkedinUrl),
    sections: {
      ctaLabel: str(f.ctaLabel),
      peopleKicker: str(f.peopleKicker),
      peopleTitle: str(f.peopleTitle),
      peopleLede: str(f.peopleLede),
      insightsKicker: str(f.insightsKicker),
      insightsTitle: str(f.insightsTitle),
      insightsLede: str(f.insightsLede),
      momentsKicker: str(f.momentsKicker),
      momentsTitle: str(f.momentsTitle),
      momentsLede: str(f.momentsLede),
    },
  };
}

function readGenerated(): SugconData | null {
  if (!fs.existsSync(GENERATED_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(GENERATED_PATH, "utf8")) as Partial<
      SugconData & { generatedAt?: string }
    >;
    if (!raw.banner) return null;
    return {
      banner: {
        title: str(raw.banner.title),
        metaDescription: str(raw.banner.metaDescription),
        eyebrow: str(raw.banner.eyebrow),
        headline: str(raw.banner.headline),
        intro: str(raw.banner.intro),
        heroImageUrl: str(raw.banner.heroImageUrl),
        linkedinUrl: str(raw.banner.linkedinUrl),
        sections: { ...EMPTY_SECTIONS, ...(raw.banner.sections || {}) },
      },
      connections: raw.connections || [],
      insights: raw.insights || [],
      moments: raw.moments || [],
    };
  } catch {
    return null;
  }
}

async function fetchFromContentful(): Promise<SugconData | null> {
  if (!isContentfulConfigured()) return null;
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });

  try {
    const [pagesRes, connectionsRes, insightsRes, momentsRes] =
      await Promise.all([
        client.getEntries({
          content_type: "sugconPage",
          include: 2,
          limit: 1,
        } as never),
        client.getEntries({
          content_type: "communityConnection",
          order: ["fields.order"],
          include: 2,
          limit: 50,
        } as never),
        client.getEntries({
          content_type: "communityInsight",
          order: ["fields.order"],
          include: 2,
          limit: 50,
        } as never),
        client.getEntries({
          content_type: "communityMoment",
          order: ["fields.order"],
          include: 2,
          limit: 50,
        } as never),
      ]);

    const page = pagesRes.items[0] as Entry | undefined;
    if (!page && !connectionsRes.items.length) return null;

    const data = emptyData();
    if (page) {
      data.banner = mapPageFields(page.fields as Record<string, unknown>);
    }

    data.connections = connectionsRes.items.map((e) => {
      const f = e.fields as Record<string, unknown>;
      const gallery = Array.isArray(f.gallery) ? (f.gallery as Asset[]) : [];
      return {
        name: str(f.name),
        role: str(f.role),
        company: str(f.company),
        eventName: str(f.eventName),
        eventYear: str(f.eventYear),
        connectionNote: str(f.connectionNote),
        photoUrl: assetUrl(f.photo as Asset | undefined),
        galleryUrls: gallery.map((a) => assetUrl(a)).filter(Boolean),
        featured: Boolean(f.featured),
        order: typeof f.order === "number" ? f.order : 0,
      };
    });

    data.insights = insightsRes.items.map((e) => {
      const f = e.fields as Record<string, unknown>;
      return {
        title: str(f.title),
        summary: str(f.summary),
        detail: str(f.detail),
        imageUrl: assetUrl(f.image as Asset | undefined),
        eventName: str(f.eventName),
        eventYear: str(f.eventYear),
        order: typeof f.order === "number" ? f.order : 0,
      };
    });

    data.moments = momentsRes.items.map((e) => {
      const f = e.fields as Record<string, unknown>;
      return {
        title: str(f.title),
        caption: str(f.caption),
        imageUrl: assetUrl(f.image as Asset | undefined),
        order: typeof f.order === "number" ? f.order : 0,
      };
    });

    return data;
  } catch {
    return null;
  }
}

/** Contentful Delivery API first; build snapshot second. No hardcoded copy. */
export async function getSugconData(): Promise<SugconData> {
  const remote = await fetchFromContentful();
  if (remote) return remote;

  const generated = readGenerated();
  if (generated) return generated;

  return emptyData();
}
