import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import TitleBanner from "@/components/TitleBanner";
import Breadcrumb from "@/components/Breadcrumb";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import Layout from "@/components/Layout";
import BlogPostsGrid from "@/components/blog/BlogPostsGrid";
import CategorySideNav from "@/components/categories/CategorySideNav";
import type { Blog } from "@/types/blog";
import {
  getBlogsForCategory,
  getCategoryBySlug,
  loadCategoryMeta,
  type CategoryMeta,
} from "@/lib/categories";
import config from "@/lib/config";

interface Props {
  blogs: Blog[];
  categorySlug: string;
  categoryLabel: string;
  categoryDescription: string;
  allCategories: CategoryMeta[];
}

const CategoryDetailsPage: React.FC<Props> = ({
  blogs,
  categorySlug,
  categoryLabel,
  categoryDescription,
  allCategories,
}) => {
  const canonicalPath = `/categories/${categorySlug}`;
  const pageTitle = `${categoryLabel} Articles | Sitecore & .NET`;
  const pageDescription = `${categoryDescription} Browse ${blogs.length} article${
    blogs.length === 1 ? "" : "s"
  } on ${categoryLabel}.`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${config.base_url}${canonicalPath}`,
    about: categoryLabel,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: blogs.length,
      itemListElement: blogs.slice(0, 20).map((blog, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: blog.title,
        url: `${config.base_url}${blog.url ?? `/blogs/${blog.slug}`}`,
      })),
    },
  };

  return (
    <Layout>
      <WebsiteMetaBundle
        path={canonicalPath}
        title={pageTitle}
        description={pageDescription}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
      </Head>
      <TitleBanner title={categoryLabel} />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid blog-body-layout">
          <div className="blog-container page-content category-listing">
            <header className="category-listing-header">
              <p className="category-listing-lead">{categoryDescription}</p>
              <p className="category-listing-meta">
                <strong>{blogs.length}</strong>{" "}
                {blogs.length === 1 ? "article" : "articles"} in this category
                {" · "}
                <Link href="/categories">All categories</Link>
              </p>
            </header>

            <BlogPostsGrid
              blogs={blogs}
              emptyMessage={`No articles in “${categoryLabel}” yet. Check back soon or browse other categories.`}
            />
          </div>

          <aside className="blog-side-container" aria-label="Categories">
            <CategorySideNav
              categories={allCategories}
              activeSlug={categorySlug}
            />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryDetailsPage;

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const categorySlug = context.params?.tags as string;
  const meta = getCategoryBySlug(categorySlug);
  const categoryLabel = meta?.name ?? categorySlug;
  const categoryDescription =
    meta?.description ??
    `Articles and tutorials about ${categoryLabel} for Sitecore and .NET developers.`;

  return {
    props: {
      blogs: await getBlogsForCategory(categorySlug),
      categorySlug,
      categoryLabel,
      categoryDescription,
      allCategories: loadCategoryMeta(),
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = loadCategoryMeta().map((tag) => ({
    params: { tags: tag.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};
