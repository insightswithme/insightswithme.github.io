import fs from "fs";
import path from "path";
import { createClient } from "contentful";
import { isContentfulConfigured } from "@/lib/contentful";

export type SitePage = {
  title: string;
  slug: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  intro: string;
  body: string;
  heroImageUrl: string;
  linkedinUrl: string;
  careerStartYear: number | null;
  sitecoreStartYear: number | null;
};

const GENERATED_PATH = path.join(
  process.cwd(),
  "content",
  "generated",
  "pages.json"
);

const DEFAULT_ABOUT: SitePage = {
  title: "About",
  slug: "about",
  metaDescription:
    "About Pawan Tyagi — Technical Lead at Altudo, Sitecore XM Cloud certified developer.",
  eyebrow: "CRAFT • PLATFORM • PURPOSE",
  headline: "The platform was always his north star.",
  intro:
    "For Pawan Tyagi, Sitecore and .NET were never just tools — they were the path to building experiences people actually use. From early days shipping .NET solutions to leading XM Cloud and Content Hub delivery at Altudo, he has been obsessed with making complex platforms feel clear. He doesn't just write code; he shares practical patterns on InsightsWithMe so other developers can ship with confidence.",
  body: `Hi,

My name is Pawan Tyagi. I have over **{{overallYears}}** years of experience in software development and **{{sitecoreYears}}** years focused on Sitecore and digital experience platforms. Currently, I work as a **Technical Lead at Altudo** in Gurugram, leading Sitecore engineering delivery across XM Cloud, Content Hub, Search, and Helix-based solutions.

I am a Sitecore 2× certified developer (including **XM Cloud Developer** and **Sitecore 10 .NET Developer**), Sitecore 9 Platform Associate Developer, **Optimizely CMS Certified Developer**, and a **Microsoft Azure Developer Associate (AZ-204)**. My toolkit also includes Helix, .NET MVC, Docker, and JSS.

Through my blog *Insights With Me*, I share practical Sitecore tutorials and real-world project learnings — from publishing and serialization to Search crawlers and Content Hub integrations — to help other developers ship with confidence.

For any queries or questions, feel free to connect with me on [LinkedIn]({{linkedinUrl}}).

Happy learning!`,
  heroImageUrl: "/images/about-story-illustration.png",
  linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
  careerStartYear: 2012,
  sitecoreStartYear: 2018,
};

function readGeneratedPages(): SitePage[] {
  if (!fs.existsSync(GENERATED_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(GENERATED_PATH, "utf8")) as {
      items?: SitePage[];
    };
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchPageFromContentful(slug: string): Promise<SitePage | null> {
  if (!isContentfulConfigured()) return null;
  const space = process.env.CONTENTFUL_SPACE_ID!;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN!;
  const client = createClient({
    space,
    accessToken,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await client.getEntries({
    content_type: "page",
    "fields.slug": slug,
    limit: 1,
  } as any);

  const entry = res.items[0];
  if (!entry) return null;
  const f = entry.fields as Record<string, unknown>;

  return {
    title: String(f.title || slug),
    slug: String(f.slug || slug),
    metaDescription: String(f.metaDescription || ""),
    eyebrow: String(f.eyebrow || ""),
    headline: String(f.headline || ""),
    intro: String(f.intro || ""),
    body: String(f.body || ""),
    heroImageUrl: String(f.heroImageUrl || ""),
    linkedinUrl: String(f.linkedinUrl || ""),
    careerStartYear:
      typeof f.careerStartYear === "number" ? f.careerStartYear : null,
    sitecoreStartYear:
      typeof f.sitecoreStartYear === "number" ? f.sitecoreStartYear : null,
  };
}

export type PageTokenMap = Record<string, string | number | undefined | null>;

/** Apply dynamic tokens in page markdown/text fields. */
export function resolvePageTokens(
  page: SitePage,
  extra: PageTokenMap = {}
): SitePage {
  const year = new Date().getFullYear();
  const overallYears =
    page.careerStartYear != null
      ? String(year - page.careerStartYear)
      : "13";
  const sitecoreYears =
    page.sitecoreStartYear != null
      ? String(year - page.sitecoreStartYear)
      : "8";
  const linkedinUrl =
    page.linkedinUrl || "https://www.linkedin.com/in/pawan-tyagi-6bb22357/";

  const tokens: Record<string, string> = {
    overallYears,
    sitecoreYears,
    linkedinUrl,
  };
  for (const [key, value] of Object.entries(extra)) {
    if (value != null) tokens[key] = String(value);
  }

  const replace = (text: string) => {
    let out = text || "";
    for (const [key, value] of Object.entries(tokens)) {
      out = out.replaceAll(`{{${key}}}`, value);
    }
    return out;
  };

  return {
    ...page,
    intro: replace(page.intro),
    body: replace(page.body),
    headline: replace(page.headline),
    metaDescription: replace(page.metaDescription),
  };
}

export async function getPageBySlug(
  slug: string,
  extraTokens: PageTokenMap = {}
): Promise<SitePage | null> {
  try {
    const remote = await fetchPageFromContentful(slug);
    if (remote) return resolvePageTokens(remote, extraTokens);
  } catch (err) {
    console.warn(`[pages] Contentful fetch failed for "${slug}"`, err);
  }

  const generated = readGeneratedPages().find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase()
  );
  if (generated) return resolvePageTokens(generated, extraTokens);

  if (slug.toLowerCase() === "about") {
    return resolvePageTokens(DEFAULT_ABOUT, extraTokens);
  }

  return null;
}
