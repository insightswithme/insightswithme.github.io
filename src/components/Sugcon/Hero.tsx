import React from "react";
import Link from "next/link";
import type { SugconBanner } from "@/lib/sugcon";

export type SugconHeroProps = {
  banner: SugconBanner;
};

/** Hero block — text + hero image from Contentful `sugconPage`. */
const SugconHero: React.FC<SugconHeroProps> = ({ banner }) => {
  const { sections } = banner;
  const hasContent =
    banner.heroImageUrl || banner.eyebrow || banner.headline || banner.intro;

  if (!hasContent) return null;

  return (
    <section className="sugcon-hero">
      <div className="sugcon-hero__media" aria-hidden={!banner.heroImageUrl}>
        {banner.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.heroImageUrl}
            alt=""
            className="sugcon-hero__img"
          />
        ) : null}
        <div className="sugcon-hero__veil" />
      </div>
      <div className="sugcon-hero__copy">
        {banner.eyebrow ? (
          <p className="sugcon-hero__eyebrow">{banner.eyebrow}</p>
        ) : null}
        {banner.headline ? (
          <h1 className="sugcon-hero__headline">{banner.headline}</h1>
        ) : null}
        {banner.intro ? (
          <p className="sugcon-hero__intro">{banner.intro}</p>
        ) : null}
        {banner.linkedinUrl && sections.ctaLabel ? (
          <Link
            href={banner.linkedinUrl}
            className="sugcon-hero__cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {sections.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
};

export default SugconHero;
