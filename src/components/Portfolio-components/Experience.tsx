import React from "react";
import { withBasePath } from "@/lib/withBasePath";
import type { PortfolioExperience } from "@/lib/portfolio";

export interface ExperienceProps {
  title?: string;
  imageUrl?: string;
  experiences: PortfolioExperience[];
}

const Experience: React.FC<ExperienceProps> = ({
  title = "Work Experience",
  imageUrl = "/images/about-us.png",
  experiences,
}) => {
  if (!experiences.length) return null;

  return (
    <div className="promo image-left background-gray">
      <div className="component-title">
        <h2>{title}</h2>
      </div>
      <div className="container">
        <div className="promo-image">
          <img
            src={withBasePath(imageUrl)}
            alt="Experience"
            decoding="async"
          />
        </div>
        <div className="promo-content">
          <div className="experience">
            {experiences.map((org) => (
              <div key={org.organization} className="organization">
                <div className="timeline">
                  <div className="organization-name">
                    <h3>{org.organization}</h3>
                  </div>
                  {(org.roles || []).map((role) => (
                    <div
                      key={`${org.organization}-${role.title}-${role.date}`}
                      className="timeline-item"
                    >
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        {role.date ? (
                          <p className="timeline-date">{role.date}</p>
                        ) : null}
                        <h4>{role.title}</h4>
                        {role.description ? <p>{role.description}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
