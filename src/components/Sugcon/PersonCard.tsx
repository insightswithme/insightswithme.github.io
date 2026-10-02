import React from "react";
import type { CommunityConnection } from "@/lib/sugcon";

export type SugconPersonCardProps = {
  person: CommunityConnection;
  featured?: boolean;
};

/** Single connection card — fields + Media assets from Contentful. */
const SugconPersonCard: React.FC<SugconPersonCardProps> = ({
  person,
  featured = false,
}) => {
  const meta = [person.role, person.company].filter(Boolean).join(" · ");
  const event = [person.eventName, person.eventYear].filter(Boolean).join(" · ");

  return (
    <article
      className={
        featured
          ? "sugcon-person sugcon-person--featured"
          : "sugcon-person"
      }
    >
      <div className="sugcon-person__photo">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photoUrl} alt={person.name || ""} />
        ) : null}
      </div>
      <div className="sugcon-person__body">
        {meta ? <p className="sugcon-person__meta">{meta}</p> : null}
        {person.name ? (
          <h3 className="sugcon-person__name">{person.name}</h3>
        ) : null}
        {event ? <p className="sugcon-person__event">{event}</p> : null}
        {person.connectionNote ? (
          <p className="sugcon-person__note">{person.connectionNote}</p>
        ) : null}
        {featured && person.galleryUrls?.length > 1 ? (
          <div className="sugcon-person__gallery">
            {person.galleryUrls.slice(0, 4).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default SugconPersonCard;
