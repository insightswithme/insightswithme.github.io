# Contentful Draft Mode (preview) on Vercel

Enables **unpublished** Contentful content preview on https://insightswithme-blog.vercel.app via the Contentful Vercel marketplace app.

GitHub Pages stays on a **static export** (`npm run build:static`) and does not support Draft Mode.

---

## Architecture

| Host | Build | Preview drafts? |
| --- | --- | --- |
| Vercel | `npm run build` (SSR-capable, has `/api/enable-draft`) | Yes |
| GitHub Pages | `npm run build:static` (`output: "export"`, no API routes) | No |

Draft entrypoint: **`/api/enable-draft`**  
(`src/pages/api/enable-draft.ts` → `@contentful/vercel-nextjs-toolkit/pages-router`)

---

## One-time Contentful Vercel App setup

1. Contentful → **Apps → Vercel** → Install / Configure.
2. Paste a **team-scoped** Vercel access token (Scope: **All Projects** under `insightswithme`, No Expiration).
3. **Project:** `insightswithme-blog`
4. **Draft Mode route handler:** `api/enable-draft`  
   (no leading slash — match the placeholder `api/enable-draft`)
5. Save / Install.

### Required Vercel env vars

| Name | Notes |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | `7csiqfkqfved` (plain / readable) |
| `CONTENTFUL_ACCESS_TOKEN` | Delivery API |
| `CONTENTFUL_PREVIEW_TOKEN` | Preview API |
| `CONTENTFUL_PREVIEW_SECRET` | Shared secret for hobby (no Automation Bypass) |
| `CONTENTFUL_ENVIRONMENT` | `master` |
| `NEXT_PUBLIC_BASE_URL` | `https://insightswithme-blog.vercel.app` |
| `NEXT_PUBLIC_BASE_PATH` | empty |

Optional (Pro): enable **Protection Bypass for Automation** and set `VERCEL_AUTOMATION_BYPASS_SECRET` — the toolkit accepts either that or `CONTENTFUL_PREVIEW_SECRET`.

---

## Content preview URL (manual / Contentful Preview)

Example for a blog post with slug `my-post`:

```
https://insightswithme-blog.vercel.app/api/enable-draft?path=%2Fblogs%2Fmy-post&x-contentful-preview-secret=YOUR_CONTENTFUL_PREVIEW_SECRET
```

Contentful Vercel App usually builds this URL for you after install.

---

## Deploy after enabling Draft Mode

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
npx vercel --prod
```

Or push to the connected GitHub repo `insightswithme/insightswithme.github.io` on `main`.

Then refresh the Contentful Vercel app config — the “no routes configured” error should clear once `/api/enable-draft` is live.
