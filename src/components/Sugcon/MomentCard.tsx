import React from "react";
import type { CommunityMoment } from "@/lib/sugcon";

export type SugconMomentCardProps = {
  moment: CommunityMoment;
};

/** Single moment — caption + image from Contentful `communityMoment`. */
const SugconMomentCard: React.FC<SugconMomentCardProps> = ({ moment }) => {
  return (
    <figure className="sugcon-moment">
      {moment.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={moment.imageUrl} alt={moment.title || ""} />
      ) : null}
      {(moment.title || moment.caption) && (
        <figcaption>
          {moment.title ? <strong>{moment.title}</strong> : null}
          {moment.caption ? <span>{moment.caption}</span> : null}
        </figcaption>
      )}
    </figure>
  );
};

export default SugconMomentCard;
