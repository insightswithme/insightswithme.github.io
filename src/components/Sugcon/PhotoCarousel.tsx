import React from "react";

export type SugconPhotoCarouselProps = {
  images: string[];
  alt: string;
  activeIndex: number;
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
};

/**
 * Left-column image stage for featured connections.
 * Active slide is controlled by the parent (interval + thumbs from Contentful data).
 */
const SugconPhotoCarousel: React.FC<SugconPhotoCarouselProps> = ({
  images,
  alt,
  activeIndex,
  onPausedChange,
}) => {
  const slides = images.filter(Boolean);
  const count = slides.length;
  const index =
    count > 0 ? ((activeIndex % count) + count) % count : 0;

  if (!count) return null;

  if (count === 1) {
    return (
      <div className="sugcon-person__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slides[0]} alt={alt} />
      </div>
    );
  }

  return (
    <div
      className="sugcon-carousel"
      onMouseEnter={() => onPausedChange?.(true)}
      onMouseLeave={() => onPausedChange?.(false)}
      onFocusCapture={() => onPausedChange?.(true)}
      onBlurCapture={() => onPausedChange?.(false)}
    >
      <div
        className="sugcon-carousel__stage"
        aria-roledescription="carousel"
        aria-label={alt || "Photo carousel"}
      >
        {slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === index ? alt : ""}
            className={
              i === index
                ? "sugcon-carousel__slide is-active"
                : "sugcon-carousel__slide"
            }
            aria-hidden={i !== index}
          />
        ))}
      </div>
    </div>
  );
};

export default SugconPhotoCarousel;
