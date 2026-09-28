import React from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/withBasePath";
import type { PortfolioContribution } from "@/lib/portfolio";

export interface PCProps {
  title?: string;
  contributions: PortfolioContribution[];
}

const PC: React.FC<PCProps> = ({
  title = "Publications & Contributions",
  contributions,
}) => {
  if (!contributions.length) return null;

  return (
    <div className="component-section component-content">
      <div className="container">
        <div className="component-title">
          <h2>{title}</h2>
        </div>
        <div className="component-content">
          {contributions.map((item) => {
            const external =
              item.openInNewTab ||
              item.linkUrl.startsWith("http://") ||
              item.linkUrl.startsWith("https://");
            const image = (
              <img
                src={withBasePath(item.imageUrl)}
                alt={item.title}
              />
            );
            const cta = item.ctaLabel || "Visit";

            return (
              <div key={item.title} className="promo icon-promo-card col-6">
                <div className="icon-image">
                  {external ? (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {image}
                    </a>
                  ) : (
                    <Link href={item.linkUrl}>{image}</Link>
                  )}
                </div>
                <div className="title">
                  <h4>{item.title}</h4>
                </div>
                <div className="promo-link-cta button">
                  {external ? (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {cta}
                    </a>
                  ) : (
                    <Link href={item.linkUrl}>{cta}</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PC;
