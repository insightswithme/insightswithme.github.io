import type { FC } from "react";
import Head from "next/head";
import FormattedDate from "@/components/FormattedDate";
import { heroImageUrl } from "@/lib/contentfulImage";
import { withBasePath } from "@/lib/withBasePath";

export interface BlogHeaderProps {
  className?: string;
  title: string;
  date: Date;
  readingTime: string;
  featureImage: string;
  /** Historical publication source label (e.g. Perficient Blogs Archive). */
  source?: string;
  /** URL where the post was originally published. */
  originalUrl?: string;
}

const BlogHeader: FC<BlogHeaderProps> = ({
  className,
  title,
  date,
  readingTime,
  featureImage,
  source,
  originalUrl,
}) => {
  const attributionLabel = source || "original publication";
  const optimizedSrc = withBasePath(heroImageUrl(featureImage) || featureImage);

  return (
    <div className={`background-primary blog-header ${className || ""}`}>
      {optimizedSrc ? (
        <Head>
          <link rel="preload" as="image" href={optimizedSrc} />
        </Head>
      ) : null}
      <img
        className="blog-header-image"
        src={optimizedSrc}
        alt={title}
        width={1200}
        height={630}
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
      <div className="blog-header-overlay" aria-hidden="true" />
      <div className="container blog-header-content">
        <h1 id="blog-post-title">{title}</h1>
        <div className="blog-header-summary">
          <FormattedDate date={date} emoji={true} />
          <div>{readingTime}</div>
        </div>
        {originalUrl || source ? (
          <p className="blog-original-attribution">
            Originally published
            {source ? (
              <>
                {" "}
                on{" "}
                {originalUrl ? (
                  <a href={originalUrl} rel="noopener noreferrer">
                    {attributionLabel}
                  </a>
                ) : (
                  attributionLabel
                )}
              </>
            ) : originalUrl ? (
              <>
                {" "}
                at{" "}
                <a href={originalUrl} rel="noopener noreferrer">
                  {originalUrl}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default BlogHeader;
