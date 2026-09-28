import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import AboutStory from "@/components/Sections/AboutStory";
import TitleBanner from "@/components/TitleBanner";
import PageMarkdown from "@/components/PageMarkdown";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import type { GetStaticProps } from "next";

interface AboutProps {
  page: SitePage;
}

const About: React.FC<AboutProps> = ({ page }) => {
  return (
    <Layout>
      <WebsiteMetaBundle
        path="/about"
        title={page.title || "About"}
        description={page.metaDescription || undefined}
      />
      <TitleBanner title={page.title || "About"} />
      <Breadcrumb />
      <AboutStory
        eyebrow={page.eyebrow}
        headline={page.headline}
        intro={page.intro}
        heroImageUrl={page.heroImageUrl}
      />
      <div className="container">
        <div className="container-fluid">
          <div className="main-container about-body">
            <PageMarkdown markdown={page.body} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;

export const getStaticProps: GetStaticProps<AboutProps> = async () => {
  const page = await getPageBySlug("about");
  if (!page) {
    return { notFound: true };
  }
  return {
    props: { page },
  };
};
