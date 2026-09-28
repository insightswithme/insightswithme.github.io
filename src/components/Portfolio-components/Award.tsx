import React from "react";
import { withBasePath } from "@/lib/withBasePath";
import type { PortfolioCertification } from "@/lib/portfolio";

export interface AwardProps {
  title?: string;
  items: PortfolioCertification[];
}

const Award: React.FC<AwardProps> = ({
  title = "Certifications & Achievements",
  items,
}) => {
  const certifications = items.filter((i) => i.kind === "certification");
  const achievements = items.filter((i) => i.kind === "achievement");

  if (!items.length) return null;

  return (
    <section
      className="awards-section background-gray"
      aria-labelledby="awards-heading"
    >
      <div className="container">
        <div className="component-title">
          <h2 id="awards-heading">{title}</h2>
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
            {certifications.length ? (
              <>
                <h3>Licenses &amp; Certifications</h3>
                <ul className="awards-list">
                  {certifications.map((cert) => (
                    <li key={cert.title}>
                      <h4>{cert.title}</h4>
                      {cert.issuer ? <p>{cert.issuer}</p> : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {achievements.length ? (
              <>
                <h3 className="awards-subheading">Community &amp; Impact</h3>
                <ul className="awards-list">
                  {achievements.map((item) => (
                    <li key={item.title}>
                      <h4>{item.title}</h4>
                      {item.detail ? <p>{item.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Award;
