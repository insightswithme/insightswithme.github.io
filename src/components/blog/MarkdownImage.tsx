import type { ComponentPropsWithoutRef, FC } from "react";
import { contentfulImageUrl } from "@/lib/contentfulImage";
import { withBasePath } from "@/lib/withBasePath";

type MarkdownImageProps = ComponentPropsWithoutRef<"img"> & {
  node?: unknown;
};

/** Markdown images: Contentful resize + lazy load; local paths get basePath. */
const MarkdownImage: FC<MarkdownImageProps> = ({
  src,
  alt,
  node,
  loading,
  decoding,
  ...rest
}) => {
  void node;
  const srcStr = src != null ? String(src) : "";
  const optimized = contentfulImageUrl(srcStr, {
    width: 960,
    quality: 75,
    fit: "scale",
  });
  return (
    <img
      src={withBasePath(optimized || srcStr) || undefined}
      alt={alt ?? ""}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      {...rest}
    />
  );
};

export default MarkdownImage;
