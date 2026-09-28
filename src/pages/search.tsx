import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import PageMarkdown from "@/components/PageMarkdown";
import { searchItems, type SearchItem } from "@/lib/search";
import { withBasePath } from "@/lib/withBasePath";
import { getPageBySlug, type SitePage } from "@/lib/pages";
import type { GetStaticProps } from "next";

interface SearchPageProps {
  page: SitePage;
}

const SearchPage: React.FC<SearchPageProps> = ({ page }) => {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";
  const [draft, setDraft] = useState(query);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    fetch(withBasePath("/search-index.json"))
      .then((r) => r.json())
      .then((data: { items: SearchItem[] }) => {
        if (!cancelled) {
          setItems(data.items || []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(
    () => (query.trim() ? searchItems(items, query, 50) : []),
    [items, query]
  );

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/search"
        title={query ? `Search: ${query}` : page.title || "Search"}
        description={page.metaDescription || undefined}
      />
      <TitleBanner title={page.title || "Search"} />
      <Breadcrumb />
      <div className="container">
        <div className="container-fluid">
          <div className="search-page">
            {page.intro ? (
              <div className="search-page-status">
                <PageMarkdown markdown={page.intro} />
              </div>
            ) : null}
            <form
              className="search-page-form"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const value = draft.trim();
                router.push(
                  value ? `/search?q=${encodeURIComponent(value)}` : "/search"
                );
              }}
            >
              <input
                name="q"
                type="search"
                className="search-page-input"
                placeholder="Search blogs, categories, pages…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              <button type="submit" className="search-page-submit">
                Search
              </button>
            </form>

            {!loaded ? (
              <p className="search-page-status">Loading…</p>
            ) : !query.trim() ? (
              <p className="search-page-status">
                Type a keyword to find blog posts and pages.
              </p>
            ) : results.length === 0 ? (
              <p className="search-page-status">
                No results for <strong>“{query}”</strong>.
              </p>
            ) : (
              <>
                <p className="search-page-status">
                  {results.length} result{results.length === 1 ? "" : "s"} for{" "}
                  <strong>“{query}”</strong>
                </p>
                <ul className="search-page-results">
                  {results.map((hit) => (
                    <li key={hit.url} className="search-page-card">
                      <span className="search-page-type">
                        {hit.type === "post" ? "Blog" : "Page"}
                      </span>
                      <h2>
                        <Link href={hit.url}>{hit.title}</Link>
                      </h2>
                      {hit.excerpt ? <p>{hit.excerpt}</p> : null}
                      {hit.tags?.length ? (
                        <div className="search-page-tags">
                          {hit.tags.slice(0, 5).map((tag) => (
                            <Link
                              key={tag}
                              href={`/categories/${tag}`}
                              className="search-page-tag"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;

export const getStaticProps: GetStaticProps<SearchPageProps> = async () => {
  const page =
    (await getPageBySlug("search")) ||
    ({
      title: "Search",
      slug: "search",
      metaDescription:
        "Search Sitecore and XM Cloud blog posts, guides, and site pages.",
      eyebrow: "",
      headline: "",
      intro: "",
      body: "",
      heroImageUrl: "",
      linkedinUrl: "",
      careerStartYear: null,
      sitecoreStartYear: null,
    } satisfies SitePage);

  return { props: { page } };
};
