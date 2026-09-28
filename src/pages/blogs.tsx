import Link from "next/link";
import Layout from "@/components/Layout";
import { GetStaticProps } from "next";
import TitleBanner from "@/components/TitleBanner";
import Breadcrumb from "@/components/Breadcrumb";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import BlogPostsGrid from "@/components/blog/BlogPostsGrid";
import PageMarkdown from "@/components/PageMarkdown";
import { getAllBlogsSorted } from "@/lib/loadBlogs";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import { Blog } from "@/types/blog";

interface HomeProps {
  blogs: Blog[];
  page: SitePage;
}

const Home: React.FC<HomeProps> = ({ blogs, page }) => {
  return (
    <Layout>
      <WebsiteMetaBundle
        path="/blogs"
        title={page.title || "Latest Blog Articles"}
        description={page.metaDescription || undefined}
      />
      <TitleBanner title={page.title || "Latest Blog Articles"} />
      <Breadcrumb />

      <div className="container">
        <div className="blog-list">
          {page.intro ? (
            <div className="category-hub-lead">
              <PageMarkdown markdown={page.intro} />
            </div>
          ) : (
            <p className="category-hub-lead">
              Prefer topic browsing?{" "}
              <Link href="/categories">Explore categories</Link>.
            </p>
          )}
          <BlogPostsGrid blogs={blogs} />
        </div>
      </div>
    </Layout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const blogs = await getAllBlogsSorted();
  const page =
    (await getPageBySlug("blogs")) ||
    ({
      title: "Latest Blog Articles",
      slug: "blogs",
      metaDescription: "",
      eyebrow: "",
      headline: "",
      intro: "",
      body: "",
      heroImageUrl: "",
      linkedinUrl: "",
      careerStartYear: null,
      sitecoreStartYear: null,
    } satisfies SitePage);

  return {
    props: { blogs, page },
  };
};
