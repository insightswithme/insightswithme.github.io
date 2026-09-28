import fs from "fs";
import path from "path";

export interface NavItem {
  label: string;
  href: string;
  order: number;
  location: "header" | "footer" | "both";
  openInNewTab?: boolean;
}

export interface CategoryMeta {
  slug: string;
  name: string;
  description: string;
  order?: number;
}

const GENERATED_DIR = path.join(process.cwd(), "content", "generated");

function readGenerated<T>(fileName: string): T | null {
  const filePath = path.join(GENERATED_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

const DEFAULT_NAV: NavItem[] = [
  { label: "Blogs", href: "/blogs", order: 1, location: "both" },
  { label: "Categories", href: "/categories", order: 2, location: "both" },
  { label: "Search", href: "/search", order: 3, location: "header" },
  { label: "Portfolio", href: "/portfolio", order: 4, location: "header" },
  { label: "About", href: "/about", order: 5, location: "both" },
  { label: "Contact", href: "/contact", order: 6, location: "both" },
  { label: "Privacy Policy", href: "/privacy", order: 7, location: "both" },
];

/** Navigation from Contentful (synced to content/generated/navigation.json). */
export function getNavigationItems(
  location?: "header" | "footer"
): NavItem[] {
  const data = readGenerated<{ items: NavItem[] }>("navigation.json");
  const items = (data?.items?.length ? data.items : DEFAULT_NAV).slice();
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!location) return items;
  return items.filter(
    (item) => item.location === location || item.location === "both"
  );
}

/** Categories from Contentful (synced to content/generated/categories.json). */
export function getSyncedCategories(): CategoryMeta[] {
  const data = readGenerated<{ items: CategoryMeta[] }>("categories.json");
  if (!data?.items?.length) return [];
  return data.items
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
