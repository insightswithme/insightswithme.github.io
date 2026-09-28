import React from "react";
import type { PortfolioProject } from "@/lib/portfolio";

export interface ProjectsProps {
  title?: string;
  projects: PortfolioProject[];
}

const Projects: React.FC<ProjectsProps> = ({
  title = "Recent Projects",
  projects,
}) => {
  if (!projects.length) return null;

  return (
    <div className="component-section component-content">
      <div className="container">
        <div className="component-title">
          <h2>{title}</h2>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <div
              key={project.title}
              className="project-card background-white"
            >
              <div className="project-title">
                <h3>{project.title}</h3>
              </div>
              {project.duration ? (
                <div className="duration">{project.duration}</div>
              ) : null}
              {project.description ? (
                <div className="description">{project.description}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
