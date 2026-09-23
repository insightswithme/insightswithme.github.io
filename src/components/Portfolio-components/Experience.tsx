import React from "react";
import { withBasePath } from "@/lib/withBasePath";

const Experience: React.FC = () => {
  return (
    <div className="promo image-left background-gray">
      <div className="component-title">
        <h2>Work Experience</h2>
      </div>
      <div className="container">
        <div className="promo-image">
          <img
            src={withBasePath("/images/about-us.png")}
            alt="Experience"
            decoding="async"
          />
        </div>
        <div className="promo-content">
          <div className="experience">
            <div className="organization">
              <div className="timeline">
                <div className="organization-name">
                  <h3>Altudo, Gurugram, India</h3>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p className="timeline-date">June 2021 to Present</p>
                    <h4>Technical Lead</h4>
                    <p>
                      Leading Sitecore engineering delivery — XM Cloud, Content
                      Hub, Search, Helix-based solutions, and mentoring the
                      development team.
                    </p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p className="timeline-date">Earlier role at Altudo</p>
                    <h4>Senior Software Engineer</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="organization">
              <div className="timeline">
                <div className="organization-name">
                  <h3>Sapient (Publicis Sapient), Gurugram, India</h3>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p className="timeline-date">October 2016 to February 2022</p>
                    <h4>Software Engineer</h4>
                    <p>
                      Built and delivered digital solutions using .NET / MVC and
                      Sitecore for enterprise clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="organization">
              <div className="timeline">
                <div className="organization-name">
                  <h3>Espire Infolabs, Gurugram, India</h3>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p className="timeline-date">
                      September 2015 to October 2016
                    </p>
                    <h4>Software Engineer</h4>
                    <p>
                      Developed ASP.NET applications and contributed to
                      consulting delivery for IT services projects.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
