import React from "react";
import { withBasePath } from "@/lib/withBasePath";

const AboutStory: React.FC = () => {
  return (
    <section className="about-story" aria-labelledby="about-story-heading">
      <div className="about-story__inner">
        <div className="about-story__media">
          <img
            src={withBasePath("/images/about-story-illustration.png")}
            alt="Illustrated portrait of Pawan Tyagi"
            width={900}
            height={1200}
            decoding="async"
          />
        </div>
        <div className="about-story__copy">
          <p className="about-story__eyebrow">
            CRAFT <span aria-hidden="true">•</span> PLATFORM{" "}
            <span aria-hidden="true">•</span> PURPOSE
          </p>
          <h2 id="about-story-heading" className="about-story__title">
            The platform was always{" "}
            <em>his north star.</em>
          </h2>
          <p className="about-story__body">
            For Pawan Tyagi, Sitecore and .NET were never just tools — they were
            the path to building experiences people actually use. From early
            days shipping .NET solutions to leading XM Cloud and Content Hub
            delivery at Altudo, he has been obsessed with making complex
            platforms feel clear. He doesn&apos;t just write code; he shares
            practical patterns on InsightsWithMe so other developers can ship
            with confidence.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
