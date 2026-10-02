"use client";

import { useEffect, useState } from "react";
import Burger from "./Burger";

import type { FC } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/siteMeta";

export interface NavigationProps {
  className?: string;
  isFooter?: boolean;
  items?: NavItem[];
}

const Navigation: FC<NavigationProps> = ({
  className,
  isFooter,
  items = [],
}) => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const SCREEN_SM = 768;

    const updateScrollLock = () => {
      if (window.innerWidth > SCREEN_SM) {
        document.body.classList.remove("scroll-lock");
      } else if (active) {
        document.body.classList.add("scroll-lock");
      } else {
        document.body.classList.remove("scroll-lock");
      }
    };

    updateScrollLock();
    window.addEventListener("resize", updateScrollLock);

    return () => {
      document.body.classList.remove("scroll-lock");
      window.removeEventListener("resize", updateScrollLock);
    };
  }, [active]);

  return (
    <div className={isFooter ? undefined : "header-nav-wrap"}>
      {!isFooter && (
        <Burger active={active} onClick={() => setActive(!active)} />
      )}
      <nav className={className + " " + (active ? "active" : "")}>
        {!isFooter && items.some((item) => item.href === "/search") ? (
          <div className="site-search site-search-mobile">
            <Link
              href="/search"
              className="site-search-mobile-link"
              onClick={() => setActive(false)}
            >
              Search blogs…
            </Link>
          </div>
        ) : null}
        <ul className="menu">
          {items.map((item) => {
            const external =
              item.href.startsWith("http://") ||
              item.href.startsWith("https://") ||
              item.openInNewTab;
            return (
              <li key={`${item.href}-${item.label}`}>
                {external ? (
                  <a
                    href={item.href}
                    aria-label={item.label}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    onClick={() => setActive(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    onClick={() => setActive(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Navigation;
