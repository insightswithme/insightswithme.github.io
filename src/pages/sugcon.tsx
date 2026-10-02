import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import {
  SugconConnections,
  SugconHero,
  SugconInsights,
  SugconMoments,
} from "@/components/Sugcon";
import { getSugconData, type SugconData } from "@/lib/sugcon";
import type { GetStaticProps } from "next";

interface SugconProps {
  data: SugconData;
}

/**
 * SUGCON page — thin composition of Contentful-driven components.
 * All text and images come from Contentful via `getSugconData()`.
 */
const SugconPage: React.FC<SugconProps> = ({ data }) => {
  const { banner, connections, insights, moments } = data;

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/sugcon"
        title={banner.title}
        description={banner.metaDescription || undefined}
      />
      {banner.title ? <TitleBanner title={banner.title} /> : null}
      <Breadcrumb />

      <SugconHero banner={banner} />
      <SugconConnections
        connections={connections}
        sections={banner.sections}
      />
      <SugconInsights insights={insights} sections={banner.sections} />
      <SugconMoments moments={moments} sections={banner.sections} />
    </Layout>
  );
};

export default SugconPage;

export const getStaticProps: GetStaticProps<SugconProps> = async () => {
  const data = await getSugconData();
  return { props: { data } };
};
