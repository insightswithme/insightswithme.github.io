# Contentful setup (InsightsWithMe)

This site loads blog posts from **Contentful** at build time, with a fallback to local `content/blogs/*.md` if Contentful is unset or empty.

## 1. Environment

Copy `.env.example` → `.env.local` (already gitignored) and fill:

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Space ID |
| `CONTENTFUL_ENVIRONMENT` | Usually `master` |
| `CONTENTFUL_ACCESS_TOKEN` | **Content Delivery API** token (published content) |
| `CONTENTFUL_PREVIEW_TOKEN` | Optional Preview API token |
| `CONTENTFUL_MANAGEMENT_TOKEN` | CMA token for create-type / migrate scripts only |
| `CONTENTFUL_USE_PREVIEW` | Set `1` to read drafts via Preview API |
| `CONTENTFUL_UPLOAD_IMAGES` | Set `1` during migrate to upload featured images |

Site URL vars (also used by Next):

```env
NEXT_PUBLIC_BASE_URL=https://insightswithme.github.io
NEXT_PUBLIC_BASE_PATH=
```

Tokens: [API keys](https://app.contentful.com/) · [CMA personal access tokens](https://app.contentful.com/account/profile/cma_tokens)

## 2. One-shot setup

```bash
npm run contentful:setup
```

This will:

1. Create/publish the `blogPost` content type  
2. Migrate `content/blogs/*.md` into Contentful (create/update + publish)  
3. Verify the Delivery API returns posts  

Individual commands:

```bash
npm run contentful:create-type
npm run contentful:migrate
npm run contentful:verify
```

Upload featured images during migrate:

```bash
# PowerShell
$env:CONTENTFUL_UPLOAD_IMAGES="1"; npm run contentful:migrate
```

## 3. Content model (`blogPost`)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | Symbol | Required |
| `slug` | Symbol | Required, unique, kebab-case |
| `excerpt` / `description` / `metaDescription` | Text/Symbol | SEO + cards |
| `keywords` | Symbol | |
| `featuredImage` | Asset (image) | Optional |
| `featuredImageUrl` | Symbol | Local path fallback e.g. `/uploads/...` |
| `date` / `modifiedDate` | Date | |
| `tags` | Symbol[] | Categories |
| `author` | Symbol | |
| `body` | **Text** (Markdown) | Rendered with ReactMarkdown |
| `featured` | Boolean | |
| `faq` / `howto` | Object | JSON-LD helpers |

Rich Text is also supported at runtime if `body` is ever a Rich Text document (`BlogPostBody` + `@contentful/rich-text-react-renderer`).

## 4. App wiring

- Client / mappers: `src/lib/contentful.ts`
- Loader (Contentful → markdown fallback): `src/lib/loadBlogs.ts`
- Search index: `scripts/lib/fetch-posts.js` (same priority)
- Post page: `src/pages/blogs/[slug].tsx` → `BlogPostBody`

```bash
npm run dev
npm run contentful:verify
```

## 5. Day-to-day

1. Edit / publish entries in the [Contentful web app](https://app.contentful.com/)
2. Rebuild / redeploy the static site so `getStaticProps` picks up changes  
3. Or keep editing markdown locally and re-run `npm run contentful:migrate`
