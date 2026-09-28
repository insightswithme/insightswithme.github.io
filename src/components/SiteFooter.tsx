import Link from "next/link";
import { withBasePath } from "@/lib/withBasePath";
import type { NavItem } from "@/lib/siteMeta";
import footerData from "../../content/generated/footer.json";

export interface SiteFooterProps {
  navItems?: NavItem[];
}

type FooterContent = {
  aboutTitle?: string;
  aboutText?: string;
  pagesTitle?: string;
  legalTitle?: string;
  connectTitle?: string;
  copyrightText?: string;
  copyrightSuffix?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  slackUrl?: string;
  stackExchangeUrl?: string;
  twitterUrl?: string;
};

function resolveCopyright(text: string | undefined): string {
  const year = String(new Date().getFullYear());
  return (text || "© {{year}} Pawan Tyagi. All rights reserved.").replaceAll(
    "{{year}}",
    year
  );
}

const SiteFooter: React.FC<SiteFooterProps> = ({ navItems = [] }) => {
  const footer = footerData as FooterContent;
  const pageLinks = navItems.filter(
    (item) =>
      !["/privacy", "/sitemap.xml"].includes(item.href) &&
      !item.href.endsWith("rss.xml")
  );
  const legalFromCms = navItems.filter((item) => item.href === "/privacy");

  const socials = [
    {
      label: "LinkedIn",
      href: footer.linkedinUrl,
      icon: "fab fa-linkedin-in",
    },
    {
      label: "GitHub",
      href: footer.githubUrl,
      icon: "fab fa-github",
    },
    {
      label: "Sitecore Slack",
      href: footer.slackUrl,
      icon: "fab fa-slack",
    },
    {
      label: "Sitecore Stack Exchange",
      href: footer.stackExchangeUrl,
      icon: "fab fa-stack-exchange",
    },
    {
      label: "Twitter",
      href: footer.twitterUrl,
      icon: "fab fa-twitter",
    },
  ].filter((s) => Boolean(s.href));

  const copyright = resolveCopyright(footer.copyrightText);
  const suffix = footer.copyrightSuffix?.trim();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>{footer.aboutTitle || "About"}</h4>
            {footer.aboutText ? <p>{footer.aboutText}</p> : null}
            {socials.length ? (
              <div className="social-links">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                  >
                    <i className={s.icon}></i>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="footer-section">
            <h4>{footer.pagesTitle || "Important Pages"}</h4>
            <ul>
              {pageLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  {item.href.startsWith("http") || item.openInNewTab ? (
                    <a
                      href={item.href}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={
                        item.openInNewTab ? "noopener noreferrer" : undefined
                      }
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-section">
            <h4>{footer.legalTitle || "Legal & Info"}</h4>
            <ul>
              {legalFromCms.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/sitemap.xml">Sitemap</Link>
              </li>
              <li>
                <a href={withBasePath("/rss.xml")}>RSS Feed</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>{footer.connectTitle || "Connect with Me"}</h4>
            <ul className="social-links-list">
              {socials.map((s) => (
                <li key={`list-${s.label}`}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                  >
                    <i className={s.icon}></i> {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            {copyright}
            {suffix ? ` | ${suffix}` : null}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
