import React from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/withBasePath";
import type { PortfolioContribution } from "@/lib/portfolio";

export interface PCProps {
  title?: string;
  contributions: PortfolioContribution[];
}

const PC: React.FC<PCProps> = ({
  title,
  contributions,
}) => {
  if (!contributions.length) return null;

  return (
    <div className="component-section component-content">
      <div className="container">
        {title ? (
          <div className="component-title">
            <h2>{title}</h2>
          </div>
        ) : null}
        <div className="component-content">
          {contributions.map((item) => {
            const external =
              item.openInNewTab ||
              item.linkUrl.startsWith("http://") ||
              item.linkUrl.startsWith("https://");
            const image = item.imageUrl ? (
              <img src={withBasePath(item.imageUrl)} alt={item.title} />
            ) : null;
            const cta = item.ctaLabel;

            return (
              <div key={item.title} className="promo icon-promo-card col-6">
                <div className="icon-image">
                  {image &&
                    (external ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {image}
                      </a>
                    ) : (
                      <Link href={item.linkUrl}>{image}</Link>
                    ))}
                </div>
                <div className="title">
                  <h4>{item.title}</h4>
                </div>
                {cta ? (
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
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PC;
