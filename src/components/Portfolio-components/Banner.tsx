import React from "react";
import { withBasePath } from "@/lib/withBasePath";

const LINKEDIN = "https://www.linkedin.com/in/pawan-tyagi-6bb22357/";

const PromoSection: React.FC = () => {
  return (
    <div className="promo image-right background-primary">
      <div className="container">
        <div className="promo-content">
          <div className="eyebrow">Hello folks!</div>
          <div className="title">
            <h2>I am Pawan Tyagi</h2>
          </div>
          <div className="description">
            Technical Lead at Altudo · Sitecore 2× Certified · XM Cloud
            Certified · Optimizely CMS Certified · Azure AZ-204
            <br />
            <br />
            Based in Gurugram, I lead Sitecore engineering delivery with deep
            experience across XM Cloud, Content Hub, Search, Helix, Optimizely,
            and .NET MVC — plus Docker and Azure.
            <br />
            <br />
            I share practical Sitecore insights on my blog{" "}
            &quot;InsightsWithMe&quot; and contribute to the developer community.
          </div>
          <div className="button button-primary-alternate">
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              View LinkedIn Profile
            </a>
          </div>
        </div>
        <div className="promo-image promo-image-photo">
          <img
            src={withBasePath("/images/home-right.jpg")}
            alt="Hi, I am Pawan!"
            width={800}
            height={800}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};

export default PromoSection;
