import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import PageMarkdown from "@/components/PageMarkdown";
import { extractTocFromMarkdown } from "@/lib/blogToc";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import type { GetStaticProps } from "next";

interface PrivacyProps {
  page: SitePage;
}

const Privacy: React.FC<PrivacyProps> = ({ page }) => {
  const toc = extractTocFromMarkdown(page.body || "");

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/privacy"
        title={page.title || "Privacy Policy"}
        description={page.metaDescription || undefined}
      />
      <TitleBanner title={page.title || "Privacy Policy"} />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid blog-body-layout">
          <div className="blog-container page-content">
            <PageMarkdown markdown={page.body} />
          </div>

          <aside className="blog-side-container" aria-label="On this page">
            <BlogTableOfContents items={toc} />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;

export const getStaticProps: GetStaticProps<PrivacyProps> = async () => {
  const page = await getPageBySlug("privacy");
  if (!page) return { notFound: true };
  return { props: { page } };
};
