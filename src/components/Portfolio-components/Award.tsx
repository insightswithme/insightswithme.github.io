import React from "react";
import { withBasePath } from "@/lib/withBasePath";

const certifications = [
  {
    title: "Sitecore XM Cloud Developer Certification",
    issuer: "Sitecore",
  },
  {
    title: "Optimizely CMS Certified Developer",
    issuer: "Optimizely",
  },
  {
    title: "Sitecore 10 .NET Developer Certification",
    issuer: "Sitecore",
  },
  {
    title: "Sitecore 9.0 Certified Platform Associate Developer",
    issuer: "Sitecore",
  },
  {
    title: "Sitecore JSS Fundamentals 9.2",
    issuer: "Sitecore — Certificate of Completion",
  },
  {
    title: "Building Solutions using Sitecore Helix 9.2",
    issuer: "Sitecore",
  },
  {
    title: "Sitecore Platform Essentials for Developers 9.0",
    issuer: "Sitecore — Certificate of Training",
  },
  {
    title: "Microsoft Certified: Azure Developer Associate (AZ-204)",
    issuer: "Microsoft",
  },
];

const achievements = [
  {
    title: "Technical Blogger — Insights With Me",
    detail:
      "Authored 12+ in-depth posts on Sitecore XP, XM Cloud, Content Hub, Search, and Content SDK",
  },
  {
    title: "Sitecore Stack Exchange Contributor",
    detail:
      "Supporting developers and earning 300+ reputation points through community Q&A",
  },
  {
    title: "LinkedIn Sitecore Community Reach",
    detail:
      "Growing audience with strong engagement across Sitecore and digital experience topics",
  },
];

const Award = () => {
  return (
    <section className="awards-section background-gray" aria-labelledby="awards-heading">
      <div className="container">
        <div className="component-title">
          <h2 id="awards-heading">Certifications &amp; Achievements</h2>
        </div>

        <div className="awards-layout">
          <div className="awards-icon">
            <img
              src={withBasePath("/images/award-blue-icon.png")}
              alt=""
              width={120}
              height={120}
              decoding="async"
            />
          </div>

          <div className="awards-body">
            <h3>Licenses &amp; Certifications</h3>
            <ul className="awards-list">
              {certifications.map((cert) => (
                <li key={cert.title}>
                  <h4>{cert.title}</h4>
                  <p>{cert.issuer}</p>
                </li>
              ))}
            </ul>

            <h3 className="awards-subheading">Community &amp; Impact</h3>
            <ul className="awards-list">
              {achievements.map((item) => (
                <li key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Award;
