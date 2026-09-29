import config from "./config";

/** Default share / brand images (new filenames force chat-app OG cache refresh). */
const DEFAULT_OG_IMAGE = "/images/pt-og.png";
const DEFAULT_LOGO = "/images/pt-logo.png";

/** Absolute URL for meta tags and JSON-LD (handles root-relative paths). */
export function absoluteFromSiteRoot(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) {
    return `${config.base_url.replace(/\/$/, "")}${DEFAULT_OG_IMAGE}`;
  }
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("//")
  ) {
    return pathOrUrl.startsWith("//") ? `https:${pathOrUrl}` : pathOrUrl;
  }
  const base = config.base_url.replace(/\/$/, "");
  // Old leftover brand asset — never serve it for previews.
  if (pathOrUrl === "/images/logo.png" || pathOrUrl === "images/logo.png") {
    return `${base}${DEFAULT_LOGO}`;
  }
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${p}`;
}

export { DEFAULT_OG_IMAGE, DEFAULT_LOGO };
