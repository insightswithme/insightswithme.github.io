const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const removeMd = require("remove-markdown");
const { createClient } = require("contentful");
const { loadEnvFiles } = require("./load-env");

loadEnvFiles();

const root = path.join(__dirname, "..", "..");
const blogsDir = path.join(root, "content", "blogs");

function tagSlugs(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (typeof t === "object" && t ? t.tag : t))
    .filter(Boolean);
}

function assetUrl(asset) {
  const url = asset?.fields?.file?.url;
  if (!url || typeof url !== "string") return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function resolveFeaturedImage(f) {
  const fromAsset = assetUrl(f.featuredImage);
  if (fromAsset) return fromAsset;
  return typeof f.featuredImageUrl === "string" ? f.featuredImageUrl : "";
}

function fromMarkdown() {
  if (!fs.existsSync(blogsDir)) return [];
  return fs
    .readdirSync(blogsDir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(blogsDir, filename);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      const plain = removeMd(content || "")
        .replace(/\s+/g, " ")
        .trim();
      return {
        slug,
        title: data.title || slug,
        excerpt: (data.description || data.metaDescription || plain.slice(0, 160)).trim(),
        description: String(data.metaDescription || data.description || "").trim(),
        body: plain,
        markdown: content || "",
        tags: tagSlugs(data.tags),
        keywords: String(data.keywords || ""),
        date: data.date || "",
        modifiedDate: data.modifiedDate || data.date || "",
        featuredImage: data.featuredImage || "",
        filePath,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function fromContentful() {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  if (!space || !accessToken) return null;

  const client = createClient({
    space,
    accessToken,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });

  const entries = [];
  const limit = 100;
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const page = await client.getEntries({
      content_type: "blogPost",
      order: ["-fields.date"],
      limit,
      skip,
      include: 2,
    });
    total = page.total;
    entries.push(...page.items);
    skip += page.items.length;
    if (page.items.length === 0) break;
  }

  if (entries.length === 0) return [];

  return entries.map((item) => {
    const f = item.fields;
    const markdown = typeof f.body === "string" ? f.body : "";
    const plain = removeMd(markdown).replace(/\s+/g, " ").trim();
    const tags = Array.isArray(f.tags) ? f.tags.filter((t) => typeof t === "string") : [];
    return {
      slug: f.slug,
      title: f.title || f.slug,
      excerpt: (f.excerpt || f.description || f.metaDescription || plain.slice(0, 160)).trim(),
      description: String(f.metaDescription || f.description || f.excerpt || "").trim(),
      body: plain,
      markdown,
      tags,
      keywords: String(f.keywords || ""),
      date: f.date || "",
      modifiedDate: f.modifiedDate || f.date || "",
        featuredImage: resolveFeaturedImage(f),
        filePath: null,
    };
  });
}

/** Contentful first; markdown fallback. */
async function fetchPosts() {
  try {
    const remote = await fromContentful();
    if (remote && remote.length > 0) return remote;
  } catch (err) {
    console.warn("[fetch-posts] Contentful failed, using markdown:", err.message);
  }
  return fromMarkdown();
}

module.exports = { fetchPosts, fromMarkdown };
