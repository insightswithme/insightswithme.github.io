import React from "react";
import type { PortfolioSkillGroup } from "@/lib/portfolio";

export interface TechnicalSkillsProps {
  title?: string;
  groups: PortfolioSkillGroup[];
}

const TechnicalSkills: React.FC<TechnicalSkillsProps> = ({
  title,
  groups,
}) => {
  if (!groups.length) return null;

  // Keep original 2-row layout: first 3, then remaining
  const firstRow = groups.slice(0, 3);
  const secondRow = groups.slice(3);

  const renderRow = (items: PortfolioSkillGroup[]) => (
    <div className="multi-lists">
      {items.map((group) => (
        <div key={group.name} className="multi-lists-section card">
          <h4>{group.name}</h4>
          <ul>
            {group.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="component-section component-content">
      <div className="container">
        {title ? (
          <div className="component-title">
            <h2>{title}</h2>
          </div>
        ) : null}
        {renderRow(firstRow)}
        {secondRow.length ? renderRow(secondRow) : null}
      </div>
    </div>
  );
};

export default TechnicalSkills;
