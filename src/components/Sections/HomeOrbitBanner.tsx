import Link from "next/link";
import React from "react";

const ORBIT_TEXT =
  "INSIGHTSWITHME • INSIGHTSWITHME • INSIGHTSWITHME • INSIGHTSWITHME • ";

const HomeOrbitBanner: React.FC = () => {
  return (
    <section className="home-orbit-banner" aria-label="InsightsWithMe">
      <div className="home-orbit-banner__stage">
        <svg
          className="home-orbit-banner__orbit"
          viewBox="0 0 600 600"
          aria-hidden="true"
        >
          <defs>
            <path
              id="iwm-orbit-path"
              d="M 300,300 m -235,0 a 235,235 0 1,1 470,0 a 235,235 0 1,1 -470,0"
            />
          </defs>
          <g className="home-orbit-banner__spin">
            <text className="home-orbit-banner__orbit-text">
              <textPath href="#iwm-orbit-path" startOffset="0%">
                {ORBIT_TEXT}
              </textPath>
            </text>
          </g>
        </svg>

        <div className="home-orbit-banner__center">
          <h1 className="home-orbit-banner__title">Insight With PAWAN</h1>
          <p className="home-orbit-banner__lede">
            Practical Sitecore &amp; .NET insights from real delivery.
          </p>
          <Link href="/blogs" className="home-orbit-banner__cta">
            Read the Blog
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeOrbitBanner;
