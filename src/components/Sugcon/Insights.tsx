import React from "react";
import type { CommunityInsight, SugconSections } from "@/lib/sugcon";
import SugconSectionHeader from "./SectionHeader";
import SugconInsightCard from "./InsightCard";

export type SugconInsightsProps = {
  insights: CommunityInsight[];
  sections: SugconSections;
};

/** Insights section — list from Contentful `communityInsight`. */
const SugconInsights: React.FC<SugconInsightsProps> = ({
  insights,
  sections,
}) => {
  if (!insights.length) return null;

  return (
    <section className="sugcon-section sugcon-insights" id="insights">
      <div className="sugcon-section__inner">
        <SugconSectionHeader
          kicker={sections.insightsKicker}
          title={sections.insightsTitle}
          lede={sections.insightsLede}
        />
        <div className="sugcon-insights__list">
          {insights.map((insight, index) => (
            <SugconInsightCard
              key={insight.title || insight.order}
              insight={insight}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SugconInsights;
