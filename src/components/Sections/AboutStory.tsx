import React from "react";
import { withBasePath } from "@/lib/withBasePath";

export interface AboutStoryProps {
  eyebrow?: string;
  headline?: string;
  intro?: string;
  heroImageUrl?: string;
}

const AboutStory: React.FC<AboutStoryProps> = ({
  eyebrow = "CRAFT • PLATFORM • PURPOSE",
  headline = "The platform was always his north star.",
  intro = "",
  heroImageUrl = "/images/about-story-illustration.png",
}) => {
  // Allow "his north star." style emphasis on the last phrase after "always "
  const headlineHtml = (() => {
    const marker = "always ";
    const idx = headline.toLowerCase().indexOf(marker);
    if (idx === -1) return <>{headline}</>;
    const before = headline.slice(0, idx + marker.length);
    const after = headline.slice(idx + marker.length);
    return (
      <>
        {before}
        <em>{after}</em>
      </>
    );
  })();

  const eyebrowParts = eyebrow
    .split(/[•·]/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="about-story" aria-labelledby="about-story-heading">
      <div className="about-story__inner">
        <div className="about-story__media">
          <img
            src={withBasePath(heroImageUrl)}
            alt="Illustrated portrait of Pawan Tyagi"
            width={900}
            height={1200}
            decoding="async"
          />
        </div>
        <div className="about-story__copy">
          <p className="about-story__eyebrow">
            {eyebrowParts.length > 1
              ? eyebrowParts.map((part, i) => (
                  <React.Fragment key={`${part}-${i}`}>
                    {i > 0 ? (
                      <>
                        {" "}
                        <span aria-hidden="true">•</span>{" "}
                      </>
                    ) : null}
                    {part}
                  </React.Fragment>
                ))
              : eyebrow}
          </p>
          <h2 id="about-story-heading" className="about-story__title">
            {headlineHtml}
          </h2>
          {intro ? <p className="about-story__body">{intro}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
