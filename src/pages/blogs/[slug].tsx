import React, { useEffect } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "@/components/Layout";
import removeMd from "remove-markdown";
import Link from "next/link";
import { format } from "date-fns";
import type { Document } from "@contentful/rich-text-types";

import BlogPostMetaBundle from "@/components/meta/BlogPostMetaBundle";
import type { FaqItem, HowToData } from "@/components/meta/JsonLdFaqHowTo";

import "prismjs/themes/prism-tomorrow.css";
import Breadcrumb from "@/components/Breadcrumb";
import readingDuration from "reading-duration";
import BlogHeader from "@/components/BlogHeader";

import CommentBox from "@/components/CommentBox";
import BlogPostBody from "@/components/blog/BlogPostBody";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import BlogSideTags from "@/components/blog/BlogSideTags";
import { extractTocFromMarkdown } from "@/lib/blogToc";
import { getAllBlogsSorted, getBlogDetailBySlug } from "@/lib/loadBlogs";

interface BlogFrontmatterResolved {
  title: string;
  description: string;
  metaDescription: string;
  featuredImage: string;
  keywords: string;
  date: string;
  modifiedDate: string;
  tags: { tag: string }[];
  faq: FaqItem[] | null;
  howto: HowToData | null;
  author: string | null;
  originalUrl: string | null;
  source: string | null;
  canonicalUrl: string | null;
}

interface BlogProps {
  frontmatter: BlogFrontmatterResolved;
  markdown: string;
  richText: Document | null;
  slug: string;
}

const AUTHOR_NAME = "Pawan Tyagi";

const Blog: React.FC<BlogProps> = ({ frontmatter, markdown, richText, slug }) => {
  const postDate = new Date(frontmatter.date);
  const postModified = new Date(frontmatter.modifiedDate);
  const tocItems = extractTocFromMarkdown(markdown);
  const showModified =
    postModified.getTime() !== postDate.getTime() &&
    !Number.isNaN(postModified.getTime());

  useEffect(() => {
    if (typeof window !== "undefined") {
      (async () => {
        const Prism =
          (await import("prismjs")).default || (await import("prismjs"));

        await import("prismjs/components/prism-sql");
        await import("prismjs/components/prism-json");
        await import("prismjs/components/prism-csharp");
        await import("prismjs/components/prism-powershell");
        Prism.highlightAll();
      })();
    }
  }, [markdown]);

  const readingTime = readingDuration(markdown, {
    wordsPerMinute: 150,
    emoji: true,
  });

  const articlePlainText = removeMd(markdown);

  return (
    <Layout>
      <BlogPostMetaBundle
        slug={slug}
        title={frontmatter.title}
        description={frontmatter.description}
        metaDescription={frontmatter.metaDescription}
        featuredImage={frontmatter.featuredImage}
        keywords={frontmatter.keywords}
        date={postDate}
        modifiedDate={postModified}
        author={frontmatter.author || AUTHOR_NAME}
        canonicalUrl={frontmatter.canonicalUrl ?? undefined}
        articlePlainText={articlePlainText}
        tags={frontmatter.tags}
        faq={frontmatter.faq ?? undefined}
        howto={frontmatter.howto ?? undefined}
      />

      <article className="blog-post-page" aria-labelledby="blog-post-title">
        <BlogHeader
          title={frontmatter.title}
          date={postDate}
          className="blog-page"
          readingTime={readingTime}
          featureImage={frontmatter.featuredImage}
          source={frontmatter.source ?? undefined}
          originalUrl={frontmatter.originalUrl ?? undefined}
        />
        <Breadcrumb className="blog-page" />
        <div className="container">
          <div className="container-fluid blog-body-layout">
            <div className="blog-container">
              <hr className="blog-rule blog-rule-start" />
              <BlogPostBody markdown={markdown} richText={richText} />
              <hr className="blog-rule blog-rule-end" />
              <p className="blog-authored-by">
                Authored by{" "}
                <Link href="/about">{frontmatter.author || AUTHOR_NAME}</Link>{" "}
                on {format(postDate, "MMMM d, yyyy")}
                {showModified ? (
                  <>
                    {" "}
                    · Modified on {format(postModified, "MMMM d, yyyy")}
                  </>
                ) : null}
              </p>
              <CommentBox />
            </div>
            <aside className="blog-side-container" aria-label="Page navigation">
              <BlogTableOfContents items={tocItems} />
              <BlogSideTags tags={frontmatter.tags} />
            </aside>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default Blog;

export const getStaticProps: GetStaticProps<BlogProps> = async ({
  params,
  draftMode,
}) => {
  const slug = params?.slug as string;
  const preview = Boolean(draftMode);
  const post = await getBlogDetailBySlug(slug, preview);

  if (!post) {
    return { notFound: true };
  }

  const fm = post.frontmatter;

  return {
    props: {
      frontmatter: {
        title: fm.title,
        description: fm.description,
        metaDescription: fm.metaDescription,
        featuredImage: fm.featuredImage,
        keywords: fm.keywords,
        date: fm.date,
        modifiedDate: fm.modifiedDate,
        tags: fm.tags,
        faq: fm.faq ?? null,
        howto: fm.howto ?? null,
        author: fm.author ?? null,
        originalUrl: null,
        source: null,
        canonicalUrl: null,
      },
      markdown: post.markdown,
      richText: post.richText ?? null,
      slug: post.slug,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const blogs = await getAllBlogsSorted();
  const paths = blogs.map((blog) => ({
    params: { slug: blog.slug },
  }));

  const staticExport =
    process.env.STATIC_EXPORT === "1" ||
    process.env.STATIC_EXPORT === "true" ||
    process.env.GITHUB_PAGES === "true";

  return {
    paths,
    // Vercel: allow draft/new slugs at request time. Static export: must be false.
    fallback: staticExport ? false : "blocking",
  };
};
