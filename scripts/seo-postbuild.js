/**
 * Post-build SEO artifacts for static export (`out/`).
 * Run after `next build && next-sitemap`.
 */
const fs = require("fs");
const path = require("path");
const { fetchPosts } = require("./lib/fetch-posts");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "out");
const configPath = path.join(root, "content", "config.json");

const defaultProdUrl = "https://pawan-tyagi.github.io";
const rawEnv = process.env.NEXT_PUBLIC_BASE_URL;
const siteUrl =
  rawEnv &&
  !/^https?:\/\/localhost\b/i.test(rawEnv) &&
  !/^https?:\/\/127\./i.test(rawEnv)
    ? rawEnv.replace(/\/$/, "")
    : defaultProdUrl;

const siteConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parsePostDate(post) {
  const raw = post.modifiedDate || post.date;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (post.filePath && fs.existsSync(post.filePath)) {
    return fs.statSync(post.filePath).mtime;
  }
  return new Date();
}

async function loadPosts() {
  const posts = await fetchPosts();
  return posts
    .map((p) => {
      const plain = (p.body || "").trim();
      const description =
        p.description ||
        p.excerpt ||
        plain.slice(0, 160) + (plain.length > 160 ? "…" : "");
      return {
        slug: p.slug,
        title: p.title || p.slug,
        description: String(description).trim(),
        date: parsePostDate(p),
        url: `${siteUrl}/blogs/${p.slug}`,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function writeRss(posts) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(p.url)}</link>
      <guid isPermaLink="true">${escapeXml(p.url)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.site_title)}</title>
    <link>${escapeXml(siteUrl)}/</link>
    <description>${escapeXml(siteConfig.site_description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  fs.writeFileSync(path.join(outDir, "rss.xml"), xml, "utf8");
  console.log(`Wrote ${posts.length} items to out/rss.xml`);
}

function writeLlmsTxt(posts) {
  const postLines = posts
    .map((p) => `- [${p.title}](${p.url}): ${p.description}`)
    .join("\n");

  const body = `# ${siteConfig.site_title}

> ${siteConfig.site_description}

## Site

- Home: ${siteUrl}/
- Blog listing: ${siteUrl}/blogs
- Categories: ${siteUrl}/categories
- About: ${siteUrl}/about
- RSS: ${siteUrl}/rss.xml

## Blog posts

${postLines}

## Crawling

User-agent: *
Allow: /
Disallow: /admin

This site welcomes AI assistants and search engines. Content is for public reference.
`;

  fs.writeFileSync(path.join(outDir, "llms.txt"), body, "utf8");
  console.log(`Wrote ${posts.length} posts to out/llms.txt`);
}

async function main() {
  if (!fs.existsSync(outDir)) {
    console.error("out/ not found — run next build before seo-postbuild");
    process.exit(1);
  }
  const posts = await loadPosts();
  writeRss(posts);
  writeLlmsTxt(posts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
