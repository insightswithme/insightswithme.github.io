/**
 * Contentful Images API helpers.
 * Docs: https://www.contentful.com/developers/docs/references/images-api/
 */

export type ContentfulImageOptions = {
  /** Max width in px */
  width?: number;
  /** Max height in px */
  height?: number;
  /** 1–100 */
  quality?: number;
  /** Prefer webp for display; use jpg for OG if needed */
  format?: "webp" | "jpg" | "png" | "avif";
  fit?: "pad" | "fill" | "scale" | "crop" | "thumb";
};

function isContentfulAssetUrl(url: string): boolean {
  try {
    const host = new URL(url.startsWith("//") ? `https:${url}` : url).hostname;
    return (
      host === "images.ctfassets.net" ||
      host.endsWith(".ctfassets.net") ||
      host === "assets.ctfassets.net"
    );
  } catch {
    return false;
  }
}

/** Normalize protocol-relative Contentful URLs to https. */
export function normalizeAssetUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

/**
 * Append Images API transforms for faster downloads.
 * Non-Contentful / local paths are returned unchanged (after normalize).
 */
export function contentfulImageUrl(
  url: string | undefined | null,
  options: ContentfulImageOptions = {}
): string {
  const normalized = normalizeAssetUrl(url);
  if (!normalized || !isContentfulAssetUrl(normalized)) {
    return normalized;
  }

  const {
    width,
    height,
    quality = 75,
    format = "webp",
    fit = "fill",
  } = options;

  try {
    const u = new URL(normalized);
    if (width) u.searchParams.set("w", String(width));
    if (height) u.searchParams.set("h", String(height));
    if (fit) u.searchParams.set("fit", fit);
    if (format) u.searchParams.set("fm", format);
    if (quality) u.searchParams.set("q", String(quality));
    return u.toString();
  } catch {
    return normalized;
  }
}

/** Card / list thumbnails */
export function cardImageUrl(url: string | undefined | null): string {
  return contentfulImageUrl(url, { width: 720, height: 400, quality: 70 });
}

/** Blog post hero (LCP) */
export function heroImageUrl(url: string | undefined | null): string {
  return contentfulImageUrl(url, { width: 1400, height: 735, quality: 78 });
}

/** Open Graph / Twitter share image */
export function ogImageUrl(url: string | undefined | null): string {
  return contentfulImageUrl(url, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "jpg",
  });
}
