import React, { useEffect, useState } from "react";
import type { CommunityConnection } from "@/lib/sugcon";
import SugconPhotoCarousel from "./PhotoCarousel";

export type SugconPersonCardProps = {
  person: CommunityConnection;
  featured?: boolean;
};

function carouselSlides(person: CommunityConnection): string[] {
  const fromGallery = (person.galleryUrls || []).filter(Boolean);
  if (fromGallery.length) return Array.from(new Set(fromGallery));
  return person.photoUrl ? [person.photoUrl] : [];
}

/** Single connection card — fields + Media assets from Contentful. */
const SugconPersonCard: React.FC<SugconPersonCardProps> = ({
  person,
  featured = false,
}) => {
  const meta = [person.role, person.company].filter(Boolean).join(" · ");
  const event = [person.eventName, person.eventYear].filter(Boolean).join(" · ");
  const slides = carouselSlides(person);
  const intervalMs =
    typeof person.carouselIntervalMs === "number"
      ? person.carouselIntervalMs
      : 0;
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSlideIndex(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (!featured || slides.length < 2 || intervalMs <= 0 || paused) return;
    const id = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [featured, slides.length, intervalMs, paused]);

  return (
    <article
      className={
        featured
          ? "sugcon-person sugcon-person--featured"
          : "sugcon-person"
      }
    >
      {featured && slides.length > 0 ? (
        <SugconPhotoCarousel
          images={slides}
          alt={person.name || ""}
          activeIndex={slideIndex}
          onPausedChange={setPaused}
        />
      ) : (
        <div className="sugcon-person__photo">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photoUrl} alt={person.name || ""} />
          ) : null}
        </div>
      )}

      <div className="sugcon-person__body">
        {meta ? <p className="sugcon-person__meta">{meta}</p> : null}
        {person.name ? (
          <h3 className="sugcon-person__name">{person.name}</h3>
        ) : null}
        {event ? <p className="sugcon-person__event">{event}</p> : null}
        {person.connectionNote ? (
          <p className="sugcon-person__note">{person.connectionNote}</p>
        ) : null}
        {featured && slides.length > 1 ? (
          <div className="sugcon-person__gallery sugcon-carousel__thumbs">
            {slides.slice(0, 4).map((url, i) => (
              <button
                key={url}
                type="button"
                className={
                  i === slideIndex
                    ? "sugcon-carousel__thumb is-active"
                    : "sugcon-carousel__thumb"
                }
                aria-label={`Show image ${i + 1}`}
                aria-current={i === slideIndex}
                onClick={() => setSlideIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default SugconPersonCard;
