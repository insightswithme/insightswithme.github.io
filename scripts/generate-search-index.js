/**
 * Builds public/search-index.json for client-side site search.
 * Run: node scripts/generate-search-index.js
 */
const fs = require("fs");
const path = require("path");
const { fetchPosts } = require("./lib/fetch-posts");

const root = path.join(__dirname, "..");
const outPath = path.join(root, "public", "search-index.json");

const pages = [
  {
    type: "page",
    title: "About Pawan Tyagi",
    slug: "about",
    url: "/about",
    excerpt: "Technical Lead at Altudo — Sitecore XM Cloud certified developer.",
    body: "About Pawan Tyagi Altudo Sitecore XM Cloud Azure certification Helix",
    tags: [],
    keywords: ["about", "pawan tyagi"],
    date: "",
    featuredImage: "",
  },
  {
    type: "page",
    title: "Contact",
    slug: "contact",
    url: "/contact",
    excerpt: "Send a message or connect on LinkedIn and GitHub.",
    body: "Contact form email LinkedIn GitHub reach out",
    tags: [],
    keywords: ["contact"],
    date: "",
    featuredImage: "",
  },
  {
    type: "page",
    title: "Portfolio",
    slug: "portfolio",
    url: "/portfolio",
    excerpt: "Experience, certifications, skills, and publications.",
    body: "Portfolio experience certifications skills Altudo Sitecore",
    tags: [],
    keywords: ["portfolio"],
    date: "",
    featuredImage: "",
  },
  {
    type: "page",
    title: "Blog Categories",
    slug: "categories",
    url: "/categories",
    excerpt: "Browse Sitecore, XM Cloud, Search, and more by category.",
    body: "Categories Sitecore XM Cloud Search Content Hub Forms",
    tags: [],
    keywords: ["categories"],
    date: "",
    featuredImage: "",
  },
  {
    type: "page",
    title: "All Blogs",
    slug: "blogs",
    url: "/blogs",
    excerpt: "Full list of technical Sitecore and XM Cloud articles.",
    body: "Blogs articles Sitecore tutorials",
    tags: [],
    keywords: ["blogs"],
    date: "",
    featuredImage: "",
  },
];

async function main() {
  const posts = (await fetchPosts()).map((p) => ({
    type: "post",
    title: p.title,
    slug: p.slug,
    url: `/blogs/${p.slug}`,
    excerpt: p.excerpt,
    body: (p.body || "").slice(0, 4000),
    tags: p.tags,
    keywords: String(p.keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    date: p.date || "",
    featuredImage: p.featuredImage || "",
  }));

  const index = {
    generatedAt: new Date().toISOString(),
    items: [...posts, ...pages],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(index));
  console.log(
    `Wrote ${index.items.length} search items → public/search-index.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
