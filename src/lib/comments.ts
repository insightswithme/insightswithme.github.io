import { isContentfulConfigured } from "@/lib/contentful";
import { createClient } from "contentful";
import { withBasePath } from "@/lib/withBasePath";

export const BLOG_COMMENT_TYPE = "blogComment";

export type BlogComment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";

function deliveryClient() {
  if (!SPACE || !TOKEN) {
    throw new Error("Contentful Delivery is not configured");
  }
  return createClient({
    space: SPACE,
    accessToken: TOKEN,
    environment: ENVIRONMENT,
  });
}

export async function fetchCommentsBySlug(slug: string): Promise<BlogComment[]> {
  if (!isContentfulConfigured() || !slug) return [];
  try {
    const res = await deliveryClient().getEntries({
      content_type: BLOG_COMMENT_TYPE,
      "fields.postSlug": slug,
      order: ["sys.createdAt"],
      limit: 100,
    } as never);
    const comments: BlogComment[] = [];
    for (const entry of res.items) {
      const fields = entry.fields as Record<string, unknown>;
      const name = String(fields.name || "").trim();
      const body = String(fields.body || "").trim();
      if (!body) continue;
      comments.push({
        id: entry.sys.id,
        name: name || "Guest",
        body,
        createdAt: String(entry.sys.createdAt),
      });
    }
    return comments;
  } catch (err) {
    console.warn(`[comments] Failed to load comments for "${slug}"`, err);
    return [];
  }
}

/** GitHub Pages has no API routes; post to the Vercel comments API. */
export function commentsSubmitUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_COMMENTS_API_URL || "").trim();
  if (explicit) return explicit;
  if (
    typeof window !== "undefined" &&
    /\.github\.io$/i.test(window.location.hostname)
  ) {
    return "https://insightswithme-blog.vercel.app/api/comments";
  }
  return withBasePath("/api/comments");
}
