import Breadcrumb from "@/components/Breadcrumb";
import ContactForm from "@/components/ContactForm";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import PageMarkdown from "@/components/PageMarkdown";
import { extractTocFromMarkdown } from "@/lib/blogToc";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import type { GetStaticProps } from "next";

interface ContactProps {
  page: SitePage;
}

const Contact: React.FC<ContactProps> = ({ page }) => {
  const toc = extractTocFromMarkdown(page.body || "");

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/contact"
        title={page.title || "Contact"}
        description={page.metaDescription || undefined}
      />
      <TitleBanner title={page.title || "Contact Me"} />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid blog-body-layout">
          <div className="blog-container page-content">
            {page.intro ? <PageMarkdown markdown={page.intro} /> : null}

            <ContactForm />

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

export default Contact;

export const getStaticProps: GetStaticProps<ContactProps> = async () => {
  const page = await getPageBySlug("contact");
  if (!page) return { notFound: true };
  return { props: { page } };
};
