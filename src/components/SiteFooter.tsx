// import config from "@/lib/config";
// import Navigation from "./Navigation";
import Link from "next/link";
import { withBasePath } from "@/lib/withBasePath";

const SiteFooter: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Pawan</h4>
            <p>
              Technical Lead at Altudo (Gurugram). Sitecore XM Cloud &amp; 10
              .NET certified, Azure AZ-204. Passionate about sharing Sitecore
              knowledge through blogging and community engagement.
            </p>
            <div className="social-links">
              <a
                href="https://www.linkedin.com/in/pawan-tyagi-6bb22357/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="https://github.com/pawan-tyagi"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="https://sitecorechat.slack.com/team/U066H8NTN6N"
                target="_blank"
                rel="noopener noreferrer"
                title="Sitecore Slack"
              >
                <i className="fab fa-slack"></i>
              </a>
              <a
                href="https://sitecore.stackexchange.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Sitecore Stack Exchange"
              >
                <i className="fab fa-stack-exchange"></i>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Important Pages</h4>
            <ul>
              <li>
                <Link href="/blogs">Blog Home</Link>
              </li>
              <li>
                <Link href="/categories">Categories</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal & Info</h4>
            <ul>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/sitemap.xml">Sitemap</Link>
              </li>
              <li>
                <a href={withBasePath("/rss.xml")}>RSS Feed</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect with Me</h4>
            <ul className="social-links-list">
              <li>
                <a
                  href="https://www.linkedin.com/in/pawan-tyagi-6bb22357/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                >
                  <i className="fab fa-linkedin-in"></i> LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/pawan-tyagi"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                >
                  <i className="fab fa-github"></i> GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://sitecorechat.slack.com/team/U066H8NTN6N"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Sitecore Slack"
                >
                  <i className="fab fa-slack"></i> Slack
                </a>
              </li>
              <li>
                <a
                  href="https://sitecore.stackexchange.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Sitecore Stack Exchange"
                >
                  <i className="fab fa-stack-exchange"></i> Stack Exchange
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Twitter"
                >
                  <i className="fab fa-twitter"></i> Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; 2026 Pawan Tyagi. All rights reserved. | Built with
            passion for sharing knowledge
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
