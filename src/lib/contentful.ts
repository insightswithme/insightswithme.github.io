import { createClient, type Asset, type ContentfulClientApi, type Entry } from "contentful";
import type { Document } from "@contentful/rich-text-types";
import removeMd from "remove-markdown";
import type { Blog } from "@/types/blog";
import type { FaqItem, HowToData } from "@/components/meta/JsonLdFaqHowTo";

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const PREVIEW_TOKEN = process.env.CONTENTFUL_PREVIEW_TOKEN;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";
const USE_PREVIEW =
  process.env.CONTENTFUL_USE_PREVIEW === "1" ||
  process.env.CONTENTFUL_USE_PREVIEW === "true";

export const CONTENTFUL_CONTENT_TYPE = "blogPost";

export type BlogPostFields = {
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  metaDescription?: string;
  keywords?: string;
  featuredImage?: Asset;
  /** Local/public path fallback, e.g. `/uploads/banner.png` */
  featuredImageUrl?: string;
  date: string;
  modifiedDate?: string;
  tags?: string[];
  author?: string;
  /** Markdown string (current) or Rich Text document */
  body: string | Document;
  featured?: boolean;
  faq?: FaqItem[];
  howto?: HowToData;
};

// Contentful's generated Entry generics are strict; keep runtime casts local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntry = Entry<any, undefined, string>;

export function isContentfulConfigured(): boolean {
  return Boolean(SPACE && TOKEN);
}

function getClient(): ContentfulClientApi<undefined> {
  if (!SPACE) {
    throw new Error("Missing CONTENTFUL_SPACE_ID in environment");
  }

  if (USE_PREVIEW) {
    if (!PREVIEW_TOKEN) {
      throw new Error(
        "CONTENTFUL_USE_PREVIEW is set but CONTENTFUL_PREVIEW_TOKEN is missing"
      );
    }
    return createClient({
      space: SPACE,
      accessToken: PREVIEW_TOKEN,
      environment: ENVIRONMENT,
      host: "preview.contentful.com",
    });
  }

  if (!TOKEN) {
    throw new Error(
      "Missing CONTENTFUL_ACCESS_TOKEN in environment"
    );
  }
  return createClient({
    space: SPACE,
    accessToken: TOKEN,
    environment: ENVIRONMENT,
  });
}

function isRichTextDocument(value: unknown): value is Document {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Document).nodeType === "document" &&
      Array.isArray((value as Document).content)
  );
}

/** Flatten Rich Text to plain text for excerpts / read time. */
function richTextToPlain(doc: Document): string {
  const walk = (node: { nodeType?: string; value?: string; content?: unknown[] }): string => {
    if (node.nodeType === "text" && typeof node.value === "string") {
      return node.value;
    }
    if (!Array.isArray(node.content)) return "";
    return node.content.map((child) => walk(child as typeof node)).join(" ");
  };
  return walk(doc).replace(/\s+/g, " ").trim();
}

function resolveBody(f: BlogPostFields): {
  markdown: string;
  richText: Document | null;
  plain: string;
} {
  if (isRichTextDocument(f.body)) {
    const plain = richTextToPlain(f.body);
    return { markdown: "", richText: f.body, plain };
  }
  const markdown = typeof f.body === "string" ? f.body : "";
  const plain = removeMd(markdown).replace(/\s+/g, " ").trim();
  return { markdown, richText: null, plain };
}

export function assetUrl(asset: Asset | undefined): string {
  const url = asset?.fields?.file?.url;
  if (!url || typeof url !== "string") return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function resolveFeaturedImage(f: BlogPostFields): string {
  const fromAsset = assetUrl(f.featuredImage);
  if (fromAsset) return fromAsset;
  return typeof f.featuredImageUrl === "string" ? f.featuredImageUrl : "";
}

function fieldsOf(entry: AnyEntry): BlogPostFields {
  return entry.fields as unknown as BlogPostFields;
}

export function mapEntryToBlog(entry: AnyEntry): Blog {
  const f = fieldsOf(entry);
  const { plain } = resolveBody(f);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const tags = Array.isArray(f.tags)
    ? f.tags.filter((t): t is string => typeof t === "string")
    : [];

  return {
    title: f.title,
    excerpt:
      f.excerpt ||
      f.description ||
      f.metaDescription ||
      plain.slice(0, 150) + (plain.length > 150 ? "..." : ""),
    category: tags.length ? tags : undefined,
    date: f.date,
    readTime: `${Math.ceil(words / 200) || 1} min read`,
    iconClass: "",
    featuredImage: resolveFeaturedImage(f),
    url: `/blogs/${f.slug}`,
    featured: Boolean(f.featured),
    content: plain,
    slug: f.slug,
  };
}

export type BlogPostDetail = {
  slug: string;
  markdown: string;
  richText: Document | null;
  frontmatter: {
    title: string;
    description: string;
    metaDescription: string;
    featuredImage: string;
    keywords: string;
    date: string;
    modifiedDate: string;
    tags: { tag: string }[];
    /** Use null (not undefined) — Next.js getStaticProps JSON serialization */
    faq: FaqItem[] | null;
    howto: HowToData | null;
    author: string | null;
  };
};

function coerceIsoDate(value: unknown, fallback?: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const parsed = new Date(String(value ?? ""));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  if (fallback) return fallback;
  return new Date().toISOString();
}

export function mapEntryToDetail(entry: AnyEntry): BlogPostDetail {
  const f = fieldsOf(entry);
  const date = coerceIsoDate(f.date);
  const modifiedDate = coerceIsoDate(f.modifiedDate, date);
  const tags = Array.isArray(f.tags)
    ? f.tags
        .filter((t): t is string => typeof t === "string")
        .map((tag) => ({ tag }))
    : [];
  const { markdown, richText } = resolveBody(f);

  return {
    slug: f.slug,
    markdown,
    richText: richText ?? null,
    frontmatter: {
      title: f.title,
      description: f.description || f.excerpt || f.metaDescription || "",
      metaDescription: f.metaDescription || f.description || f.excerpt || "",
      featuredImage: resolveFeaturedImage(f),
      keywords: f.keywords || "",
      date,
      modifiedDate,
      tags,
      faq: f.faq ?? null,
      howto: f.howto ?? null,
      author: f.author ?? null,
    },
  };
}

export async function fetchAllBlogEntries(): Promise<AnyEntry[]> {
  if (!isContentfulConfigured()) return [];

  const client = getClient();
  const entries: AnyEntry[] = [];
  const limit = 100;
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const page = await client.getEntries({
      content_type: CONTENTFUL_CONTENT_TYPE,
      order: ["-fields.date"],
      limit,
      skip,
      include: 2,
      // SDK query generics reject custom field filters/order
    } as never);
    total = page.total;
    entries.push(...page.items);
    skip += page.items.length;
    if (page.items.length === 0) break;
  }

  return entries;
}

export async function fetchBlogEntryBySlug(
  slug: string
): Promise<AnyEntry | null> {
  if (!isContentfulConfigured()) return null;

  const client = getClient();
  const res = await client.getEntries({
    content_type: CONTENTFUL_CONTENT_TYPE,
    "fields.slug": slug,
    limit: 1,
    include: 2,
  } as never);

  return res.items[0] ?? null;
}
