import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { Blog } from "@/types/blog";
import { getAllBlogsSorted } from "@/lib/loadBlogs";
import {
  getSyncedCategories,
  type CategoryMeta,
} from "@/lib/siteMeta";

export type { CategoryMeta };

export interface CategoryWithStats extends CategoryMeta {
  postCount: number;
  latestTitle: string | null;
  latestSlug: string | null;
}

const TAGS_PATH = path.resolve(process.cwd(), "./content/meta/tags.yml");

function loadCategoriesFromYaml(): CategoryMeta[] {
  if (!fs.existsSync(TAGS_PATH)) return [];
  const file = fs.readFileSync(TAGS_PATH, "utf8");
  const data = yaml.load(file) as {
    tags: { slug: string; name: string; description?: string }[];
  };

  return (data.tags || []).map((t, index) => ({
    slug: t.slug,
    name: t.name,
    description:
      t.description?.trim() ||
      `Articles and tutorials about ${t.name} for Sitecore and .NET developers.`,
    order: index + 1,
  }));
}

/**
 * Category list — prefers Contentful sync (`content/generated/categories.json`),
 * falls back to local `content/meta/tags.yml`.
 */
export function loadCategoryMeta(): CategoryMeta[] {
  const synced = getSyncedCategories();
  if (synced.length > 0) return synced;
  return loadCategoriesFromYaml();
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return loadCategoryMeta().find(
    (t) => t.slug.toLowerCase() === slug.toLowerCase()
  );
}

export function blogMatchesCategory(blog: Blog, categorySlug: string): boolean {
  if (!blog.category) return false;
  const categories = Array.isArray(blog.category)
    ? blog.category
    : typeof blog.category === "string"
      ? [blog.category]
      : [];
  return categories.some(
    (cat) => cat.toLowerCase() === categorySlug.toLowerCase()
  );
}

export async function getBlogsForCategory(
  categorySlug: string
): Promise<Blog[]> {
  const blogs = await getAllBlogsSorted();
  return blogs.filter((blog) => blogMatchesCategory(blog, categorySlug));
}

export async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  const blogs = await getAllBlogsSorted();
  return loadCategoryMeta().map((meta) => {
    const matched = blogs.filter((blog) =>
      blogMatchesCategory(blog, meta.slug)
    );
    const latest = matched[0];
    return {
      ...meta,
      postCount: matched.length,
      latestTitle: latest?.title ?? null,
      latestSlug: latest?.slug ?? null,
    };
  });
}
