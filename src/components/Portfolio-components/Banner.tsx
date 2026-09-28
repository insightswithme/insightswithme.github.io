import React from "react";
import { withBasePath } from "@/lib/withBasePath";
import type { PortfolioBanner } from "@/lib/portfolio";

export interface BannerProps {
  banner: PortfolioBanner;
}

const Banner: React.FC<BannerProps> = ({ banner }) => {
  const paragraphs = (banner.intro || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="promo image-right background-primary">
      <div className="container">
        <div className="promo-content">
          {banner.eyebrow ? (
            <div className="eyebrow">{banner.eyebrow}</div>
          ) : null}
          <div className="title">
            <h2>{banner.headline || banner.title}</h2>
          </div>
          <div className="description">
            {paragraphs.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 ? (
                  <>
                    <br />
                    <br />
                  </>
                ) : null}
                {p}
              </React.Fragment>
            ))}
          </div>
          {banner.linkedinUrl ? (
            <div className="button button-primary-alternate">
              <a
                href={banner.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {banner.ctaLabel || "View LinkedIn Profile"}
              </a>
            </div>
          ) : null}
        </div>
        <div className="promo-image promo-image-photo">
          <img
            src={withBasePath(banner.heroImageUrl || "/images/home-right.jpg")}
            alt={banner.headline || "Portfolio"}
            width={800}
            height={800}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;
