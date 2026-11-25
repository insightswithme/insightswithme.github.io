---
title: "Sitecore Search Decoded: Architecture, Ingestion Strategies, and Production Realities"
description: >-
  How Sitecore Search works as a managed discovery layer for headless stacks:
  the query path, pull and push ingestion, document extractors, the React SDK,
  the Ingestion API, and the limits that show up after go-live.
keywords: >-
  sitecore search, xm cloud, ingestion api, document extractor, headless search,
  customer engagement console
metaDescription: >-
  Sitecore Search architecture, pull vs push ingestion, extractor and React SDK
  code, and the production limits that matter after go-live.
slug: sitecore-search-decoded-architecture-ingestion-and-production
date: 'October 13, 2026 10:30 PM'
modifiedDate: 'October 13, 2026 10:30 PM'
author: Pawan Tyagi
source: Insights With Me
featuredImage: /uploads/banner-sitecore-search-decoded.jpg
tags:
  - tag: sitecore-search
  - tag: sitecore
---

The day the front end moved to Next.js and the content moved off a single XP database, the Solr cluster stopped being the search problem. Someone still has to crawl HTML, call Experience Edge, push catalog updates, and give marketing a console that does not require a schema reload.

That job is what Sitecore Search is for.

Sitecore Search is Sitecore’s cloud-native search and recommendation engine, delivered as SaaS and built on the Reflektion platform. It sits beside the CMS as a decoupled discovery layer: it aggregates content from many sources, indexes it as documents, applies relevance models, and serves results to whatever front end you ship.

This guide covers the architecture, the ingestion choices, working code for extractors and a React results widget, the real trade-offs, and the failures that stay quiet until production.

## Life of a query

Search schemas are not bound to the CMS database. A page, a product, a PDF, and an Experience Edge item all become the same kind of document before a visitor ever types a query.

| Stage | Role |
| --- | --- |
| Sources | Public HTML, Experience Edge (GraphQL), headless CMS or PIM APIs, webhooks, CI/CD push |
| Triggers and crawlers | Decide when a crawl starts and fetch the raw payload (sitemap, RSS, URL, REST) |
| Document extractors | Turn HTML or JSON into a document with the required attributes |
| Semantic ranking | Query understanding, synonyms, typo tolerance, clickstream personalization |
| Runtime API and SDKs | Facets, pagination, typeahead, and widgets for React, Next.js, or Vue |

A request from the browser never talks to Solr, ZooKeeper, or the CMS database. The headless client calls Sitecore Search. The index was already built by a crawler or by a push.

Four attributes are mandatory on every document: `id`, `name`, `type`, and `url`. Miss any one of them and the record is dropped. The crawler can still report success. That silent drop is the first production bug teams hit, and the extractor section below is written to prevent it.

## Pull vs push

Sitecore Search supports three pull patterns and one push pattern. Pick the pattern from the shape of the source, then live with the operational cost of that choice.

| Model | Source | Use it when | Watch for |
| --- | --- | --- | --- |
| Pull | Basic web crawler | Server-rendered sites, blogs, public marketing pages | Follows links and sitemaps, respects `robots.txt`, reads standard HTML meta tags |
| Pull | Advanced web crawler | Dynamic or headless pages that need custom DOM parsing | Custom request headers, localized paths, Cheerio extractors |
| Pull | API crawler | Headless CMS endpoints and Experience Edge (GraphQL) | Clean JSON, no DOM render; can index fragments that have no public URL |
| Push | Ingestion API | Webhooks on publish or unpublish, CI/CD | HTTP POST, asynchronous; updates do not wait for the next crawl |

Pull is the right default when the site is already on the public internet and a schedule is good enough. Push is the right default when a publish, an unpublish, or a price change has to show up before the next crawler window.

API crawlers are the better pull for XM Cloud. They read structured content from Experience Edge and skip the cost of rendering every route just so a crawler can scrape it. I covered the crawler setup, including offset and cursor pagination, in [Mastering Sitecore Search API Crawlers](/blogs/mastering-sitecore-search-api-crawlers-a-comprehensive-series-part-1-3). File-based feeds over SFTP are a separate path: [Implementing a Feed Crawler with SFTP](/blogs/implementing-a-feed-crawler-in-sitecore-search-with-sftp).

## Document extractor

Document extractors run in the Customer Engagement Console (CEC). They map a fetched page onto your schema. The function must return the four mandatory fields on every record, with fallbacks, or that URL disappears from the index without a failed crawl.

```javascript
// Document extractor in the Sitecore Search CEC (Cheerio)
function extract(request, response) {
  const $ = response.body;

  // Fallback ID so a missing meta tag does not drop the document
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || request.url;
  const pageId = $('meta[name="article:id"]').attr('content')
    || canonicalUrl.split('/').filter(Boolean).pop();

  // Strip chrome before reading body text
  $('nav, footer, script, style, .cookie-banner').remove();
  const rawContent = $('main, article, #content').text().replace(/\s+/g, ' ').trim();

  const keywords = $('meta[name="keywords"]').attr('content');

  return [{
    id: pageId,
    type: $('meta[property="og:type"]').attr('content') || 'article',
    name: $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    url: canonicalUrl,
    content_text: rawContent,
    tags: keywords ? keywords.split(',').map((s) => s.trim()) : [],
    published_date: $('meta[property="article:published_time"]').attr('content')
      || new Date().toISOString()
  }];
}
```

A few rules that keep this extractor honest:

- Resolve `id` from a stable meta value, then from the canonical URL slug. A title is a poor id. Titles change; URLs used as ids collide across locales.
- Remove navigation, footer, scripts, and cookie banners before you read `content_text`. Otherwise the index is full of “Accept cookies” and the relevance model ranks chrome.
- Prefer `og:title` and the meta description over the first heading. Headings are often decorative.
- Return an array. One response can emit one document or several, which is how an API crawler indexes fragments that do not have their own URL.

Attribute names in the return object must match the schema you defined in CEC. `content_text`, `tags`, and `published_date` are examples. If the attribute is not in the schema, the extractor can succeed and the field still never becomes filterable.

## Search results in Next.js

The `@sitecore-search/react` package tracks keyphrase, facets, page, and the query result for a widget you already registered in CEC. The string passed to `widget()` (`content` in this example) is that widget’s RFKID, not a free-form label. If the id does not match the widget in CEC, the hook returns an empty result and the UI looks like a ranking bug.

```tsx
import React from 'react';
import {
  WidgetDataType,
  useSearchResults,
  widget,
} from '@sitecore-search/react';

interface ContentItem {
  id: string;
  name: string;
  url: string;
  description?: string;
  type?: string;
}

const SearchResultsComponent = () => {
  const {
    widgetRef,
    actions: { onKeyphraseChange, onPageNumberChange, onFacetClick, onClearFilters },
    state: { page, itemsPerPage, keyphrase },
    queryResult: {
      isLoading,
      data: {
        total_item: totalItems = 0,
        facet: facets = [],
        content: results = [],
      } = {},
    },
  } = useSearchResults<ContentItem>();

  const pageCount = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div ref={widgetRef} className="search-wrapper">
      <input
        type="search"
        value={keyphrase}
        onChange={(e) => onKeyphraseChange({ keyphrase: e.target.value })}
        placeholder="Search articles and resources..."
        className="search-input"
      />

      <div className="search-layout">
        <aside className="facets-panel">
          <button type="button" onClick={onClearFilters}>Reset Filters</button>
          {facets.map((facetGroup) => (
            <div key={facetGroup.name} className="facet-group">
              <h4>{facetGroup.label}</h4>
              {facetGroup.value.map((facetVal) => (
                <label key={facetVal.id} className="facet-option">
                  <input
                    type="checkbox"
                    checked={facetVal.selected}
                    onChange={() =>
                      onFacetClick({
                        facetId: facetGroup.name,
                        facetValueId: facetVal.id,
                      })
                    }
                  />
                  {facetVal.text} ({facetVal.count})
                </label>
              ))}
            </div>
          ))}
        </aside>

        <main className="results-container">
          {isLoading && <p>Loading results...</p>}

          {!isLoading && results.length === 0 && (
            <p>No results found for "{keyphrase}".</p>
          )}

          {results.map((item) => (
            <article key={item.id} className="result-card">
              <a href={item.url}>
                <h3>{item.name}</h3>
              </a>
              <p>{item.description}</p>
            </article>
          ))}

          <div className="pagination-bar">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageNumberChange({ page: page - 1 })}
            >
              Previous
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page * itemsPerPage >= totalItems}
              onClick={() => onPageNumberChange({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export const SearchResultsWidget = widget(
  SearchResultsComponent,
  WidgetDataType.SEARCH_RESULTS,
  'content'
);
```

`widgetRef` has to land on the root element. The SDK uses it for analytics events. A results list that looks correct and never records clicks is usually a missing ref, not a CEC analytics outage.

`total_item`, `facet`, and `content` are the response field names. They are snake_case because that is the query API, even though the rest of the component is TypeScript.

## Pushing a document

When a webhook or a pipeline should update one entity without waiting for a crawl, post it to the Ingestion API. Replace the domain, source, and bearer token with the values from CEC. The example below uses a placeholder host and a placeholder key.

```http
POST https://api.search.sitecorecloud.io/ingestion/v1/domains/{domain_id}/sources/{source_id}/entities/content/documents
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

```json
{
  "document": {
    "id": "item-solr-setup-01",
    "type": "blog_post",
    "name": "Setting Up SolrCloud with ZooKeeper on Windows",
    "description": "A deep dive into multi-node Solr clusters for enterprise search architectures.",
    "url": "https://example.com/blog/solrcloud-setup",
    "language": "en",
    "fields": {
      "author": "Tech Architect",
      "reading_time_minutes": 7,
      "categories": ["Infrastructure", "Search Engine"]
    }
  }
}
```

The call is asynchronous. Acceptance of the request is not the same as the document already being searchable. Confirm the id with a search before you tell a publisher the item is live.

Use the same `id` the crawler would have produced. If push and pull disagree on id, you index the item twice and then fail to delete one of the copies.

## What you gain and what you give up

| Dimension | What you gain | What you give up |
| --- | --- | --- |
| Infrastructure | No ZooKeeper ensemble, disk planning, or Solr patch cycle. The service is managed. | The engine is a black box. You cannot read raw Lucene parse logs or the scoring equation. |
| Coverage | One index can hold XM Cloud, Contentful, Shopify, PDFs, and a support portal. | Default tiers cap a domain at about 50 sources and about 500,000 documents. Contracted limits can be higher. Check them before you design the source model. |
| Relevance | NLP query understanding, typo tolerance, synonyms, and boosting rules in CEC. | You cannot drop in a custom relevance plugin or an arbitrary scoring formula. |
| Delivery | React and Next.js SDK widgets cover the standard results, facet, and typeahead cases. | Cloud crawlers cannot reach localhost. Staging behind Basic Auth or Vercel Deployment Protection needs an explicit bypass. |
| Configuration | Schemas and extractors live in the console, so a field change does not require a deploy. | A source you created for a test can be archived. Treat archive as the retirement action and name sources as if they will stay. |

If the requirement is a private Solr cluster with switch-on-rebuild, that is a different system. I wrote the Windows setup for that path separately: [How to Set Up SolrCloud with ZooKeeper for Sitecore](/blogs/how-to-set-up-solrcloud-with-zookeeper-for-sitecore-on-windows).

## Production gotchas

### Silent drops

A document missing `id`, `name`, `type`, or `url` is discarded. The crawl log stays green. Enforce fallbacks in the extractor, then spot-check a sample of URLs in CEC after the first full crawl. Compare crawled URL count with indexed document count. A gap there is missing attributes, not a slow indexer.

### The 50-source ceiling

A source per brand, per locale, runs out of room once you pass a few dozen sites. On a default tier the domain holds about 50 sources. Put related sites behind one sitemap-index trigger. Write `site_name` or `brand_id` onto the document and filter at query time. You spend one source and keep locale as an attribute.

Confirm the number on your subscription. The design mistake is the same at any cap: one crawler per site does not scale with the number of brands.

### Staging auth

Preview deployments protected by Vercel Deployment Protection or Basic Auth return 401 or 403 to a cloud crawler. The crawler is not logged in, and it should not be given a user password.

For Vercel, add a request header on the crawler:

- Header: `x-vercel-protection-bypass`
- Value: the `VERCEL_AUTOMATION_BYPASS_SECRET` for that project

Keep the secret in the crawler configuration, not in the sitemap and not in client-side code.

### Deletes and locales

An Ingestion API delete with `"locale": "all"` fails when that document id does not exist in every locale you have registered. Delete per language code. A loop over `en`, `fr`, and `de` is slower and it actually removes the documents.

### Serverless cost

A web crawler that hits Next.js SSR or ISR routes will execute those functions and can inflate both the hosting bill and analytics. Strip tracking query parameters in the trigger, set a crawl rate you can afford, and prefer an Experience Edge API crawler whenever the content already exists as JSON.

### Ids that change

Canonical URLs change when you rename a slug. If `id` is the slug, the rename creates a new document and leaves the old one in the index until something deletes it. Prefer a CMS item id, and send a delete for the previous id from the unpublish or rename webhook.

## When to choose it

Choose Sitecore Search when:

- The stack is composable. XM Cloud, Next.js, Astro, or a similar headless front end, and you want discovery without operating Solr.
- One search box must cover more than one platform: CMS, commerce, manuals, documentation.
- Marketing needs to own facets, boosting, banners, and rules in CEC.

Look at Algolia, Coveo, or Elasticsearch when:

- You need instant search across tens of millions of SKUs, with inventory updates pushed continuously and latency budgets in the sub-millisecond range.
- Results must be security-trimmed per user against Active Directory or OAuth entitlements. Sitecore Search is a discovery index, not a permission-aware content tree.
- You are on Sitecore XP on-premises and Solr is already wired through publishing, indexes, and switch-on-rebuild. Replacing that with a SaaS crawler adds a second source of truth.

The practical split I use: Sitecore Search in front of a headless, multi-source site; SolrCloud behind XP where the CMS already depends on it. They solve different jobs, and most programs that try to make one of them do both end up maintaining both anyway.
