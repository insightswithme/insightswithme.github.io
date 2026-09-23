import type { FC } from "react";

export interface IntroContentProps {
  className?: string;
}

const LINKEDIN = "https://www.linkedin.com/in/pawan-tyagi-6bb22357/";

const IntroContent: FC<IntroContentProps> = ({ className }) => {
  return (
    <div className={`intro-content ${className || ""}`}>
      <h4 className="intro-title">About Me</h4>
      <div className="hero-author-photo">
        <img
          src="https://avatars.githubusercontent.com/u/56933773"
          alt="Profile Picture - Pawan Tyagi"
        />
      </div>
      <p className="intro-snippet">
        I&apos;m Pawan Tyagi, Technical Lead at Altudo in Gurugram. Sitecore 2×
        certified (including XM Cloud) and Microsoft Azure AZ-204 certified, I
        specialize in Helix, .NET MVC, and modern Sitecore platforms.
      </p>
      <div className="intro-action">
        <a href={LINKEDIN} className="button button-primary" target="_blank" rel="noopener noreferrer">
          Visit LinkedIn
        </a>
      </div>
    </div>
  );
};

export default IntroContent;
