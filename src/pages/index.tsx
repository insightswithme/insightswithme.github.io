import Layout from "@/components/Layout";
import Banner from "@/components/Portfolio-components/Banner";
import TechnicalSkills from "@/components/Portfolio-components/TechnicalSkills";
import Experience from "@/components/Portfolio-components/Experience";
import PC from "@/components/Portfolio-components/PC";
import Award from "@/components/Portfolio-components/Award";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import { GetStaticProps } from "next";
import HomeOrbitBanner from "@/components/Sections/HomeOrbitBanner";
import LatestBlogs from "@/components/Sections/LatestBlogs";
import { getAllBlogsSorted } from "@/lib/loadBlogs";
import { getPortfolioData, type PortfolioData } from "@/lib/portfolio";
import type { Blog } from "@/types/blog";

type HomeProps = {
  blogs: Blog[];
  portfolio: PortfolioData;
};

const Home = ({ blogs, portfolio }: HomeProps) => {
  const { banner } = portfolio;

  return (
    <Layout>
      <WebsiteMetaBundle path="/" title="Sitecore & .NET Developer Blog" />

      <HomeOrbitBanner />
      <LatestBlogs blogs={blogs} />
      <Banner banner={banner} />
      <Experience
        title={banner.experienceSectionTitle}
        imageUrl={banner.experienceImageUrl}
        experiences={portfolio.experiences}
      />
      <Award
        title={banner.awardsSectionTitle}
        certificationsSubtitle={banner.certificationsSubtitle}
        achievementsSubtitle={banner.achievementsSubtitle}
        iconUrl={banner.awardsIconUrl}
        items={portfolio.certifications}
      />
      <PC
        title={banner.contributionsSectionTitle}
        contributions={portfolio.contributions}
      />
      <TechnicalSkills
        title={banner.skillsSectionTitle}
        groups={portfolio.skillGroups}
      />
    </Layout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: {
    blogs: await getAllBlogsSorted(),
    portfolio: await getPortfolioData(),
  },
});
