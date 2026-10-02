import React from "react";
import type { CommunityInsight } from "@/lib/sugcon";

export type SugconInsightCardProps = {
  insight: CommunityInsight;
  index: number;
};

/** Single insight card — copy + image from Contentful `communityInsight`. */
const SugconInsightCard: React.FC<SugconInsightCardProps> = ({
  insight,
  index,
}) => {
  const event = [insight.eventName, insight.eventYear]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="sugcon-insight">
      <div className="sugcon-insight__index" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="sugcon-insight__copy">
        {insight.title ? (
          <h3 className="sugcon-insight__title">{insight.title}</h3>
        ) : null}
        {insight.summary ? (
          <p className="sugcon-insight__summary">{insight.summary}</p>
        ) : null}
        {insight.detail ? (
          <p className="sugcon-insight__detail">{insight.detail}</p>
        ) : null}
        {event ? <p className="sugcon-insight__event">{event}</p> : null}
      </div>
      {insight.imageUrl ? (
        <div className="sugcon-insight__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={insight.imageUrl} alt={insight.title || ""} />
        </div>
      ) : null}
    </article>
  );
};

export default SugconInsightCard;
