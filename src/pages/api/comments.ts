import type { NextApiRequest, NextApiResponse } from "next";
import { fetchBlogEntryBySlug, isContentfulConfigured } from "@/lib/contentful";
import { BLOG_COMMENT_TYPE } from "@/lib/comments";

const LOCALE = "en-US";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

function allowedOrigins(): string[] {
  const extra = readEnv("COMMENTS_ALLOWED_ORIGINS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const base = readEnv("NEXT_PUBLIC_BASE_URL").replace(/\/$/, "");
  return [
    ...new Set(
      [
        "https://insightswithme.github.io",
        "http://insightswithme.github.io",
        "https://insightswithme-blog.vercel.app",
        "https://insightswithme-github-io-insightswithme.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        base,
        ...extra,
      ].filter(Boolean)
    ),
  ];
}

function originAllowed(origin: string): boolean {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:") return false;
    if (hostname.endsWith(".github.io")) return true;
    if (
      hostname.endsWith(".vercel.app") &&
      hostname.includes("insightswithme")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = String(req.headers.origin || "");
  if (originAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

async function cma(
  method: string,
  urlPath: string,
  {
    token,
    body,
    version,
    contentTypeId,
  }: {
    token: string;
    body?: unknown;
    version?: number;
    contentTypeId?: string;
  }
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (version != null) headers["X-Contentful-Version"] = String(version);
  if (contentTypeId) headers["X-Contentful-Content-Type"] = contentTypeId;
  if (body !== undefined) {
    headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
  }
  const res = await fetch(`https://api.contentful.com${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data as { sys: { id: string } };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const spaceId = readEnv("CONTENTFUL_SPACE_ID");
  const token = readEnv("CONTENTFUL_MANAGEMENT_TOKEN");
  const envId = readEnv("CONTENTFUL_ENVIRONMENT") || "master";

  if (!spaceId || !isContentfulConfigured()) {
    return res.status(503).json({ error: "Comments are not configured" });
  }
  if (!token) {
    return res.status(503).json({
      error: "Comment submit is not configured (missing Contentful management token)",
    });
  }

  const payload = typeof req.body === "object" && req.body ? req.body : {};
  const website = String(payload.website || "").trim();
  if (website) {
    return res.status(200).json({ ok: true });
  }

  const slug = String(payload.slug || "").trim().toLowerCase();
  const name = String(payload.name || "").trim().slice(0, 80);
  const body = String(payload.body || "").trim().slice(0, 4000);

  if (!SLUG_RE.test(slug) || !name || !body) {
    return res.status(400).json({ error: "Name, comment, and post are required" });
  }

  const post = await fetchBlogEntryBySlug(slug);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  const commentsEnabled = (post.fields as { commentsEnabled?: boolean })
    .commentsEnabled;
  if (commentsEnabled === false) {
    return res.status(403).json({ error: "Comments are closed for this post" });
  }

  await cma(
    "POST",
    `/spaces/${spaceId}/environments/${envId}/entries`,
    {
      token,
      contentTypeId: BLOG_COMMENT_TYPE,
      body: {
        fields: {
          name: { [LOCALE]: name },
          body: { [LOCALE]: body },
          postSlug: { [LOCALE]: slug },
        },
      },
    }
  );

  return res.status(201).json({
    ok: true,
    pending: true,
  });
}
