import Breadcrumb from "@/components/Breadcrumb";
import Layout from "@/components/Layout";
import WebsiteMetaBundle from "@/components/meta/WebsiteMetaBundle";
import TitleBanner from "@/components/TitleBanner";
import { getSugconData, type SugconData } from "@/lib/sugcon";
import type { GetStaticProps } from "next";
import Link from "next/link";

interface SugconProps {
  data: SugconData;
}

const SugconPage: React.FC<SugconProps> = ({ data }) => {
  const { banner, connections, insights, moments } = data;
  const sections = banner.sections;
  const featured = connections.filter((c) => c.featured);
  const others = connections.filter((c) => !c.featured);

  return (
    <Layout>
      <WebsiteMetaBundle
        path="/sugcon"
        title={banner.title}
        description={banner.metaDescription || undefined}
      />
      {banner.title ? <TitleBanner title={banner.title} /> : null}
      <Breadcrumb />

      {(banner.heroImageUrl ||
        banner.eyebrow ||
        banner.headline ||
        banner.intro) && (
        <section className="sugcon-hero">
          <div
            className="sugcon-hero__media"
            aria-hidden={!banner.heroImageUrl}
          >
            {banner.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.heroImageUrl}
                alt=""
                className="sugcon-hero__img"
              />
            ) : null}
            <div className="sugcon-hero__veil" />
          </div>
          <div className="sugcon-hero__copy">
            {banner.eyebrow ? (
              <p className="sugcon-hero__eyebrow">{banner.eyebrow}</p>
            ) : null}
            {banner.headline ? (
              <h1 className="sugcon-hero__headline">{banner.headline}</h1>
            ) : null}
            {banner.intro ? (
              <p className="sugcon-hero__intro">{banner.intro}</p>
            ) : null}
            {banner.linkedinUrl && sections.ctaLabel ? (
              <Link
                href={banner.linkedinUrl}
                className="sugcon-hero__cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                {sections.ctaLabel}
              </Link>
            ) : null}
          </div>
        </section>
      )}

      {connections.length > 0 ? (
        <section className="sugcon-section sugcon-people" id="connections">
          <div className="sugcon-section__inner">
            {(sections.peopleKicker ||
              sections.peopleTitle ||
              sections.peopleLede) && (
              <header className="sugcon-section__head">
                {sections.peopleKicker ? (
                  <p className="sugcon-section__kicker">
                    {sections.peopleKicker}
                  </p>
                ) : null}
                {sections.peopleTitle ? (
                  <h2 className="sugcon-section__title">
                    {sections.peopleTitle}
                  </h2>
                ) : null}
                {sections.peopleLede ? (
                  <p className="sugcon-section__lede">{sections.peopleLede}</p>
                ) : null}
              </header>
            )}

            <div className="sugcon-people__featured">
              {featured.map((person) => (
                <article
                  key={person.name}
                  className="sugcon-person sugcon-person--featured"
                >
                  <div className="sugcon-person__photo">
                    {person.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={person.photoUrl} alt={person.name} />
                    ) : null}
                  </div>
                  <div className="sugcon-person__body">
                    {(person.role || person.company) && (
                      <p className="sugcon-person__meta">
                        {[person.role, person.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {person.name ? (
                      <h3 className="sugcon-person__name">{person.name}</h3>
                    ) : null}
                    {(person.eventName || person.eventYear) && (
                      <p className="sugcon-person__event">
                        {[person.eventName, person.eventYear]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {person.connectionNote ? (
                      <p className="sugcon-person__note">
                        {person.connectionNote}
                      </p>
                    ) : null}
                    {person.galleryUrls?.length > 1 ? (
                      <div className="sugcon-person__gallery">
                        {person.galleryUrls.slice(0, 4).map((url) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={url} src={url} alt="" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {others.length > 0 ? (
              <div className="sugcon-people__grid">
                {others.map((person) => (
                  <article key={person.name} className="sugcon-person">
                    <div className="sugcon-person__photo">
                      {person.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.photoUrl} alt={person.name} />
                      ) : null}
                    </div>
                    <div className="sugcon-person__body">
                      {(person.role || person.company) && (
                        <p className="sugcon-person__meta">
                          {[person.role, person.company]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {person.name ? (
                        <h3 className="sugcon-person__name">{person.name}</h3>
                      ) : null}
                      {(person.eventName || person.eventYear) && (
                        <p className="sugcon-person__event">
                          {[person.eventName, person.eventYear]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {person.connectionNote ? (
                        <p className="sugcon-person__note">
                          {person.connectionNote}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {insights.length > 0 ? (
        <section className="sugcon-section sugcon-insights" id="insights">
          <div className="sugcon-section__inner">
            {(sections.insightsKicker ||
              sections.insightsTitle ||
              sections.insightsLede) && (
              <header className="sugcon-section__head">
                {sections.insightsKicker ? (
                  <p className="sugcon-section__kicker">
                    {sections.insightsKicker}
                  </p>
                ) : null}
                {sections.insightsTitle ? (
                  <h2 className="sugcon-section__title">
                    {sections.insightsTitle}
                  </h2>
                ) : null}
                {sections.insightsLede ? (
                  <p className="sugcon-section__lede">{sections.insightsLede}</p>
                ) : null}
              </header>
            )}

            <div className="sugcon-insights__list">
              {insights.map((insight, index) => (
                <article key={insight.title} className="sugcon-insight">
                  <div className="sugcon-insight__index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="sugcon-insight__copy">
                    {insight.title ? (
                      <h3 className="sugcon-insight__title">{insight.title}</h3>
                    ) : null}
                    {insight.summary ? (
                      <p className="sugcon-insight__summary">
                        {insight.summary}
                      </p>
                    ) : null}
                    {insight.detail ? (
                      <p className="sugcon-insight__detail">{insight.detail}</p>
                    ) : null}
                    {(insight.eventName || insight.eventYear) && (
                      <p className="sugcon-insight__event">
                        {[insight.eventName, insight.eventYear]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  {insight.imageUrl ? (
                    <div className="sugcon-insight__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={insight.imageUrl} alt={insight.title} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {moments.length > 0 ? (
        <section className="sugcon-section sugcon-moments" id="moments">
          <div className="sugcon-section__inner">
            {(sections.momentsKicker ||
              sections.momentsTitle ||
              sections.momentsLede) && (
              <header className="sugcon-section__head">
                {sections.momentsKicker ? (
                  <p className="sugcon-section__kicker">
                    {sections.momentsKicker}
                  </p>
                ) : null}
                {sections.momentsTitle ? (
                  <h2 className="sugcon-section__title">
                    {sections.momentsTitle}
                  </h2>
                ) : null}
                {sections.momentsLede ? (
                  <p className="sugcon-section__lede">{sections.momentsLede}</p>
                ) : null}
              </header>
            )}

            <div className="sugcon-moments__grid">
              {moments.map((moment) => (
                <figure
                  key={`${moment.title}-${moment.imageUrl}`}
                  className="sugcon-moment"
                >
                  {moment.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={moment.imageUrl} alt={moment.title} />
                  ) : null}
                  {(moment.title || moment.caption) && (
                    <figcaption>
                      {moment.title ? <strong>{moment.title}</strong> : null}
                      {moment.caption ? <span>{moment.caption}</span> : null}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </Layout>
  );
};

export default SugconPage;

export const getStaticProps: GetStaticProps<SugconProps> = async () => {
  const data = await getSugconData();
  return { props: { data } };
};
