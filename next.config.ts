import type { NextConfig } from "next";
import path from "path";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
/** GitHub Pages / Netlify static hosting — set STATIC_EXPORT=1 (or GITHUB_PAGES). */
const staticExport =
  process.env.STATIC_EXPORT === "1" ||
  process.env.STATIC_EXPORT === "true" ||
  process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },
  env: {
    NEXT_PUBLIC_COMMENTBOX_PROJECT_ID:
      process.env.NEXT_PUBLIC_COMMENTBOX_PROJECT_ID,
  },
  basePath,
  assetPrefix: basePath,
  trailingSlash: false,
  ...(staticExport ? { output: "export" as const } : {}),
};

export default nextConfig;
