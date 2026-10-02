import React from "react";
import type { CommunityMoment, SugconSections } from "@/lib/sugcon";
import SugconSectionHeader from "./SectionHeader";
import SugconMomentCard from "./MomentCard";

export type SugconMomentsProps = {
  moments: CommunityMoment[];
  sections: SugconSections;
};

/** Moments gallery — list from Contentful `communityMoment`. */
const SugconMoments: React.FC<SugconMomentsProps> = ({ moments, sections }) => {
  if (!moments.length) return null;

  return (
    <section className="sugcon-section sugcon-moments" id="moments">
      <div className="sugcon-section__inner">
        <SugconSectionHeader
          kicker={sections.momentsKicker}
          title={sections.momentsTitle}
          lede={sections.momentsLede}
        />
        <div className="sugcon-moments__grid">
          {moments.map((moment) => (
            <SugconMomentCard
              key={`${moment.title}-${moment.imageUrl}-${moment.order}`}
              moment={moment}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SugconMoments;
