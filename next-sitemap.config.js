const fs = require("fs");
const { fetchPosts } = require("./scripts/lib/fetch-posts");

/** @type {import('next-sitemap').IConfig} */
const defaultProdUrl = "https://pawan-tyagi.github.io";
const rawEnv = process.env.NEXT_PUBLIC_BASE_URL;
const siteUrl =
  rawEnv &&
  !/^https?:\/\/localhost\b/i.test(rawEnv) &&
  !/^https?:\/\/127\./i.test(rawEnv)
    ? rawEnv.replace(/\/$/, "")
    : defaultProdUrl;

const LOW_PRIORITY_PATHS = new Set(["/privacy", "/contact"]);
const MEDIUM_PRIORITY_PATHS = new Set([
  "/about",
  "/portfolio",
  "/categories",
]);

/**
 * Prefer modifiedDate / date; fall back to now.
 * @param {{ modifiedDate?: string | Date, date?: string | Date, filePath?: string | null }} post
 */
function blogLastmod(post) {
  const fromMatter = post.modifiedDate || post.date;
  if (fromMatter) {
    const parsed = new Date(/** @type {string | Date} */ (fromMatter));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  if (post.filePath && fs.existsSync(post.filePath)) {
    return fs.statSync(post.filePath).mtime.toISOString();
  }
  return new Date().toISOString();
}

const config = {
  siteUrl,
  /** Write into `out/` after `next build` export — do not rely on `public/` copy (would stay stale). */
  outDir: "out",
  /** One `sitemap.xml` with all URLs — fewer moving parts for crawlers than a sitemap index. */
  generateIndexSitemap: false,
  generateRobotsTxt: true,
  /** Google largely ignores changefreq; omit noisy daily values. */
  changefreq: false,
  exclude: ["/admin", "/admin/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"],
      },
    ],
  },
  transform: async (cfg, loc) => {
    let priority = 0.7;
    if (loc === "/") {
      priority = 1.0;
    } else if (loc.startsWith("/blogs/") && loc !== "/blogs") {
      priority = 0.8;
    } else if (loc === "/blogs") {
      priority = 0.9;
    } else if (LOW_PRIORITY_PATHS.has(loc)) {
      priority = 0.3;
    } else if (MEDIUM_PRIORITY_PATHS.has(loc) || loc.startsWith("/categories/")) {
      priority = 0.5;
    }

    return {
      loc,
      lastmod: cfg.autoLastmod ? new Date().toISOString() : undefined,
      priority,
    };
  },
  additionalPaths: async () => {
    const posts = await fetchPosts();
    return posts.map((post) => ({
      loc: `/blogs/${post.slug}`,
      lastmod: blogLastmod(post),
      priority: 0.8,
    }));
  },
};

module.exports = config;
