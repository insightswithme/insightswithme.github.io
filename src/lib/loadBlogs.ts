import fs from "fs";
import path from "path";
import matter from "gray-matter";
import removeMd from "remove-markdown";
import type { Blog } from "@/types/blog";
import {
  fetchAllBlogEntries,
  fetchBlogEntryBySlug,
  isContentfulConfigured,
  mapEntryToBlog,
  mapEntryToDetail,
  type BlogPostDetail,
} from "@/lib/contentful";

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

function tagSlugsFromFrontmatter(tags: unknown): string[] | undefined {
  if (!Array.isArray(tags) || tags.length === 0) return undefined;
  return tags.map((tag: string | { tag: string }) =>
    typeof tag === "object" && tag !== null ? tag.tag : tag
  );
}

/** Local markdown fallback (used when Contentful is empty or unavailable). */
function getAllBlogsFromMarkdown(): Blog[] {
  if (!fs.existsSync(BLOGS_DIR)) return [];

  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));

  const blogs: Blog[] = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const file = fs.readFileSync(path.join(BLOGS_DIR, filename), "utf8");
    const matterData = matter(file);
    const plainTextContent = removeMd(matterData.content as string);
    const words = plainTextContent.split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.ceil(words / 200)} min read`;

    return {
      title: matterData.data.title as string,
      excerpt:
        (matterData.data.excerpt as string | undefined) ||
        (matterData.data.description as string | undefined) ||
        plainTextContent.slice(0, 150) +
          (plainTextContent.length > 150 ? "..." : ""),
      category: tagSlugsFromFrontmatter(matterData.data.tags),
      date: matterData.data.date as string | Date,
      readTime,
      iconClass: "",
      featuredImage: (matterData.data.featuredImage as string) || "",
      url: `/blogs/${slug}`,
      featured: Boolean(matterData.data.featured),
      content: plainTextContent,
      slug,
    };
  });

  blogs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return blogs;
}

function getBlogDetailFromMarkdown(slug: string): BlogPostDetail | null {
  const filePath = path.join(BLOGS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = matter(fs.readFileSync(filePath, "utf8"));
  const raw = fileContent.data;
  const dateValue = raw.date;
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(String(dateValue ?? ""));
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const modifiedRaw = raw.modifiedDate;
  const modified =
    modifiedRaw != null
      ? modifiedRaw instanceof Date
        ? modifiedRaw
        : new Date(String(modifiedRaw))
      : safeDate;
  const safeModified = Number.isNaN(modified.getTime()) ? safeDate : modified;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag: string | { tag: string }) =>
        typeof tag === "object" && tag !== null ? tag : { tag: String(tag) }
      )
    : [];

  return {
    slug,
    markdown: fileContent.content,
    richText: null,
    frontmatter: {
      title: String(raw.title || slug),
      description: String(raw.description || raw.metaDescription || ""),
      metaDescription: String(raw.metaDescription || raw.description || ""),
      featuredImage: String(raw.featuredImage || ""),
      keywords: String(raw.keywords || ""),
      date: safeDate.toISOString(),
      modifiedDate: safeModified.toISOString(),
      tags,
      faq: raw.faq ?? null,
      howto: raw.howto ?? null,
      author: raw.author ? String(raw.author) : null,
      commentsEnabled: raw.commentsEnabled !== false,
    },
  };
}

/**
 * Loads all posts from Contentful (published), newest first.
 * Falls back to local `content/blogs` markdown if Contentful is unset or empty.
 */
export async function getAllBlogsSorted(preview = false): Promise<Blog[]> {
  if (isContentfulConfigured()) {
    try {
      const entries = await fetchAllBlogEntries(preview);
      if (entries.length > 0) {
        return entries.map(mapEntryToBlog);
      }
      console.warn(
        "[loadBlogs] Contentful returned 0 posts; using local markdown fallback."
      );
    } catch (err) {
      console.warn(
        "[loadBlogs] Contentful fetch failed; using local markdown fallback.",
        err
      );
    }
  }

  return getAllBlogsFromMarkdown();
}

/** Single post for `/blogs/[slug]` — Contentful first, then markdown. */
export async function getBlogDetailBySlug(
  slug: string,
  preview = false
): Promise<BlogPostDetail | null> {
  if (isContentfulConfigured()) {
    try {
      const entry = await fetchBlogEntryBySlug(slug, preview);
      if (entry) return mapEntryToDetail(entry);
    } catch (err) {
      console.warn(
        `[loadBlogs] Contentful fetch for slug "${slug}" failed; trying markdown.`,
        err
      );
    }
  }

  return getBlogDetailFromMarkdown(slug);
}
