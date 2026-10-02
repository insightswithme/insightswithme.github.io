import React from "react";
import type { CommunityConnection, SugconSections } from "@/lib/sugcon";
import SugconSectionHeader from "./SectionHeader";
import SugconPersonCard from "./PersonCard";

export type SugconConnectionsProps = {
  connections: CommunityConnection[];
  sections: SugconSections;
};

/** People section — list from Contentful `communityConnection`. */
const SugconConnections: React.FC<SugconConnectionsProps> = ({
  connections,
  sections,
}) => {
  if (!connections.length) return null;

  const featured = connections.filter((c) => c.featured);
  const others = connections.filter((c) => !c.featured);

  return (
    <section className="sugcon-section sugcon-people" id="connections">
      <div className="sugcon-section__inner">
        <SugconSectionHeader
          kicker={sections.peopleKicker}
          title={sections.peopleTitle}
          lede={sections.peopleLede}
        />

        {featured.length > 0 ? (
          <div className="sugcon-people__featured">
            {featured.map((person) => (
              <SugconPersonCard
                key={person.name || person.order}
                person={person}
                featured
              />
            ))}
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="sugcon-people__grid">
            {others.map((person) => (
              <SugconPersonCard
                key={person.name || person.order}
                person={person}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SugconConnections;
