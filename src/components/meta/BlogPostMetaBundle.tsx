import BasicMeta from "@/components/meta/BasicMeta";
import JsonLdBreadcrumbList from "@/components/meta/JsonLdBreadcrumbList";
import JsonLdFaqHowTo, {
  type FaqItem,
  type HowToData,
} from "@/components/meta/JsonLdFaqHowTo";
import JsonLdMetaBlog from "@/components/meta/JsonLdMetaBlog";
import OpenGraphMeta from "@/components/meta/OpenGraphMeta";
import TwitterCardMeta from "@/components/meta/TwitterCardMeta";
import config from "@/lib/config";
import { blogPostPath } from "@/lib/blogPostPath";
import { ogImageUrl } from "@/lib/contentfulImage";
import Head from "next/head";
import { formatISO } from "date-fns";

import type { FC } from "react";

function splitKeywordString(keywords: string): string[] {
  return keywords
    .split(/,\s*/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export interface BlogPostMetaBundleProps {
  slug: string;
  title: string;
  /** Short summary (listings); falls back in BasicMeta when meta description absent. */
  description: string;
  /** Primary snippet for search and social. */
  metaDescription: string;
  featuredImage: string;
  /** Comma-separated keywords from front matter. */
  keywords: string;
  date: Date;
  modifiedDate?: Date;
  author?: string;
  /** Absolute canonical URL override for `<link rel="canonical">`. */
  canonicalUrl?: string;
  /** Plain text body for JSON-LD `articleBody` (AEO / rich context). */
  articlePlainText: string;
  tags?: { tag: string }[];
  faq?: FaqItem[];
  howto?: HowToData;
}

/**
 * Single entry point for blog post head tags: canonical, hreflang, OG article,
 * Twitter, BlogPosting + BreadcrumbList JSON-LD, optional FAQ/HowTo.
 */
const BlogPostMetaBundle: FC<BlogPostMetaBundleProps> = ({
  slug,
  title,
  description,
  metaDescription,
  featuredImage,
  keywords,
  date,
  modifiedDate,
  author = "Pawan Tyagi",
  canonicalUrl,
  articlePlainText,
  tags,
  faq,
  howto,
}) => {
  const path = blogPostPath(slug);
  const siteHref = `${config.base_url.replace(/\/$/, "")}${path}`;
  const publishedISO = formatISO(date);
  const modifiedISO = formatISO(modifiedDate ?? date);
  const authorProfileUrl = `${config.base_url.replace(/\/$/, "")}/about`;
  const keywordList = splitKeywordString(keywords);
  const articleTags = tags?.map((t) => t.tag).filter(Boolean) ?? [];
  const snippet = metaDescription || description;
  const wordCount = articlePlainText.split(/\s+/).filter(Boolean).length;
  const shareImage = ogImageUrl(featuredImage) || featuredImage;

  return (
    <>
      <Head>
        <link rel="alternate" hrefLang="en" href={siteHref} />
        <link rel="alternate" hrefLang="x-default" href={siteHref} />
      </Head>
      <BasicMeta
        url={path}
        title={title}
        description={snippet}
        keywords={keywordList.length > 0 ? keywordList : undefined}
        author={author}
        canonicalUrl={canonicalUrl}
        includeAdsense
      />
      <OpenGraphMeta
        url={path}
        title={title}
        description={metaDescription || description}
        image={shareImage}
        ogType="article"
        articlePublishedTime={publishedISO}
        articleModifiedTime={modifiedISO}
        articleAuthor={authorProfileUrl}
        articleTags={articleTags.length > 0 ? articleTags : undefined}
      />
      <TwitterCardMeta
        url={path}
        title={title}
        description={metaDescription || description}
        image={shareImage}
      />
      <JsonLdBreadcrumbList path={path} title={title} />
      <JsonLdMetaBlog
        url={path}
        title={title}
        description={metaDescription || description}
        date={date}
        modifiedDate={modifiedDate ?? date}
        content={articlePlainText}
        author={author}
        image={shareImage}
        keywords={keywordList}
        inLanguage="en"
        wordCount={wordCount}
      />
      <JsonLdFaqHowTo faq={faq} howto={howto} />
    </>
  );
};

export default BlogPostMetaBundle;
