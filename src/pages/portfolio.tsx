import Layout from "@/components/Layout";
import Banner from "@/components/Portfolio-components/Banner";
import TechnicalSkills from "@/components/Portfolio-components/TechnicalSkills";
import Experience from "@/components/Portfolio-components/Experience";
import PC from "@/components/Portfolio-components/PC";
import Award from "@/components/Portfolio-components/Award";
import Projects from "@/components/Portfolio-components/Projects";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import { getPortfolioData, type PortfolioData } from "@/lib/portfolio";
import type { GetStaticProps } from "next";

interface PortfolioProps {
  portfolio: PortfolioData;
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolio }) => {
  const { banner } = portfolio;

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/portfolio"
        title={banner.title || "Portfolio"}
        description={banner.metaDescription || undefined}
      />
      <Banner banner={banner} />
      <TechnicalSkills
        title={banner.skillsSectionTitle}
        groups={portfolio.skillGroups}
      />
      <Experience
        title={banner.experienceSectionTitle}
        imageUrl={banner.experienceImageUrl}
        experiences={portfolio.experiences}
      />
      <PC
        title={banner.contributionsSectionTitle}
        contributions={portfolio.contributions}
      />
      <Award
        title={banner.awardsSectionTitle}
        items={portfolio.certifications}
      />
      <Projects
        title={banner.projectsSectionTitle}
        projects={portfolio.projects}
      />
    </Layout>
  );
};

export default Portfolio;

export const getStaticProps: GetStaticProps<PortfolioProps> = async () => {
  const portfolio = await getPortfolioData();
  return { props: { portfolio } };
};
