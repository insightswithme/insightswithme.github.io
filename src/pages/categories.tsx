import Head from "next/head";
import { GetStaticProps } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import CategoryCards from "@/components/categories/CategoryCards";
import PageMarkdown from "@/components/PageMarkdown";
import {
  getCategoriesWithStats,
  type CategoryWithStats,
} from "@/lib/categories";
import { getAllBlogsSorted } from "@/lib/loadBlogs";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import config from "@/lib/config";

interface PageProps {
  categories: CategoryWithStats[];
  totalPosts: number;
  page: SitePage;
}

const CategoryPage: React.FC<PageProps> = ({
  categories,
  totalPosts,
  page,
}) => {
  const pageTitle = page.headline || page.title || "Blog Categories";
  const pageDescription = page.metaDescription || "";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${config.base_url}/categories`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((cat, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: cat.name,
        url: `${config.base_url}/categories/${cat.slug}`,
        description: cat.description,
      })),
    },
  };

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/categories"
        title={pageTitle}
        description={pageDescription || undefined}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      </Head>
      <TitleBanner title={page.title || "Blog Categories"} />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid blog-body-layout">
          <div className="blog-container page-content category-hub">
            {page.intro ? (
              <div className="category-hub-lead">
                <PageMarkdown markdown={page.intro} />
              </div>
            ) : (
              <p className="category-hub-lead">
                Explore {totalPosts} technical articles. Pick a category to jump
                into focused guides.
              </p>
            )}

            <CategoryCards categories={categories} />

            {page.body ? (
              <section className="category-hub-help">
                <PageMarkdown markdown={page.body} />
              </section>
            ) : null}
          </div>

          <aside className="blog-side-container" aria-label="All categories">
            <nav className="blog-toc" aria-label="All categories">
              <p className="blog-toc-title">All categories</p>
              <ol>
                {categories.map((cat) => (
                  <li key={cat.slug} className="level-2">
                    <Link href={`/categories/${cat.slug}`}>{cat.name}</Link>
                  </li>
                ))}
                <li className="level-2">
                  <Link href="/blogs">All articles</Link>
                </li>
              </ol>
            </nav>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const categories = await getCategoriesWithStats();
  const blogs = await getAllBlogsSorted();
  const totalPosts = blogs.length;
  const page =
    (await getPageBySlug("categories", { totalPosts })) ||
    ({
      title: "Blog Categories",
      slug: "categories",
      metaDescription: "",
      eyebrow: "",
      headline: "Sitecore & .NET Blog Categories",
      intro: `Explore ${totalPosts} technical articles.`,
      body: "",
      heroImageUrl: "",
      linkedinUrl: "",
      careerStartYear: null,
      sitecoreStartYear: null,
    } satisfies SitePage);

  return {
    props: {
      categories,
      totalPosts,
      page,
    },
  };
};
