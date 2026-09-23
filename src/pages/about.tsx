import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import { useEffect } from "react";

const LINKEDIN = "https://www.linkedin.com/in/pawan-tyagi-6bb22357/";

const About = () => {
  useEffect(() => {
    const currentYear = new Date().getFullYear();

    const overallExperienceElement =
      document.getElementById("overall-experience");
    const sitecoreExperienceElement = document.getElementById(
      "sitecore-experience"
    );

    // ~13+ years total experience (career start ~2012)
    if (overallExperienceElement) {
      overallExperienceElement.textContent = (currentYear - 2012).toString();
    }

    // Sitecore focus strengthens from Altudo tenure (2021+)
    if (sitecoreExperienceElement) {
      sitecoreExperienceElement.textContent = (currentYear - 2018).toString();
    }
  }, []);

  return (
    <Layout>
      <WebsiteMetaBundle path="/about" title="About" />
      <TitleBanner title="About" />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid">
          <div className="main-container">
            <p>
              Hi,
              <br />
              My name is Pawan Tyagi. I have over{" "}
              <span id="overall-experience">13</span> years of experience in
              software development and <span id="sitecore-experience">8</span>{" "}
              years focused on Sitecore and digital experience platforms.
              Currently, I work as a <strong>Technical Lead at Altudo</strong>{" "}
              in Gurugram, leading Sitecore engineering delivery across XM
              Cloud, Content Hub, Search, and Helix-based solutions.
            </p>
            <p>
              I am a Sitecore 2× certified developer (including{" "}
              <strong>XM Cloud Developer</strong> and{" "}
              <strong>Sitecore 10 .NET Developer</strong>), Sitecore 9 Platform
              Associate Developer,{" "}
              <strong>Optimizely CMS Certified Developer</strong>, and a{" "}
              <strong>Microsoft Azure Developer Associate (AZ-204)</strong>. My
              toolkit also includes Helix, .NET MVC, Docker, and JSS.
            </p>
            <p>
              Through my blog <em>Insights With Me</em>, I share practical
              Sitecore tutorials and real-world project learnings — from
              publishing and serialization to Search crawlers and Content Hub
              integrations — to help other developers ship with confidence.
            </p>
            <p>
              For any queries or questions, feel free to connect with me on{" "}
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              .
            </p>
            <p>Happy learning!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
