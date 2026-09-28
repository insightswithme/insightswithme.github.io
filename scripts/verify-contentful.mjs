/**
 * Verifies Contentful Delivery API credentials and blogPost entries.
 *
 *   npm run contentful:verify
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { loadEnvFiles } = require("./lib/load-env");
const { createClient } = require("contentful");

loadEnvFiles(path.join(__dirname, ".."));

async function main() {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_ACCESS_TOKEN;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";

  if (!space || !token) {
    throw new Error(
      "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN in .env.local"
    );
  }

  const client = createClient({
    space,
    accessToken: token,
    environment,
  });

  const types = await client.getContentTypes();
  const hasBlogPost = types.items.some((t) => t.sys.id === "blogPost");
  if (!hasBlogPost) {
    throw new Error(
      'Content type "blogPost" not found. Run: npm run contentful:create-type'
    );
  }

  const page = await client.getEntries({
    content_type: "blogPost",
    order: ["-fields.date"],
    limit: 5,
    include: 1,
  });

  console.log("Contentful OK");
  console.log(`  Space:       ${space}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  Content type blogPost: present`);
  console.log(`  Published posts: ${page.total}`);
  if (page.items.length) {
    console.log("  Latest:");
    for (const item of page.items) {
      console.log(`    - ${item.fields.slug}`);
    }
  }
  console.log(
    `\nApp: https://app.contentful.com/spaces/${space}/entries?contentTypeId=blogPost`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
