# Deploy to Vercel

This Next.js app uses `output: "export"` (static files in `out/`). Vercel builds with `npm run build` and serves that export.

**Production URL:** https://insightswithme-blog.vercel.app  
**Dashboard:** https://vercel.com/insightswithme/insightswithme-blog  

**GitHub Pages can stay as-is** — Vercel is an additional host.

---

## 1. Install CLI (one-time)

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
npm install
npm i -D vercel
```

Or use npx (no global install): `npx vercel`

---

## 2. Log in

```powershell
npx vercel login
```

Follow the browser / email prompt until the CLI says you are logged in.

---

## 3. Link the project

From the repo root:

```powershell
npx vercel link
```

Answer prompts (or accept defaults):

| Prompt | Suggested |
| --- | --- |
| Set up and deploy? | **Y** |
| Scope / team | your personal account (or team) |
| Link to existing project? | **N** (first time) |
| Project name | e.g. `insightswithme` or `pawan-tyagi-blog` |
| Directory | `./` |

This creates `.vercel/` locally (gitignored).

---

## 4. Environment variables (required for Contentful build)

In [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings → Environment Variables**, add for **Production**, **Preview**, and **Development**:

| Name | Required | Example / notes |
| --- | --- | --- |
| `CONTENTFUL_SPACE_ID` | Yes | `7csiqfkqfved` |
| `CONTENTFUL_ACCESS_TOKEN` | Yes | Delivery API token |
| `CONTENTFUL_ENVIRONMENT` | Recommended | `master` |
| `NEXT_PUBLIC_BASE_URL` | Yes | Your Vercel URL after first deploy, e.g. `https://your-project.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_BASE_PATH` | Yes (empty) | Leave **empty** on Vercel (root domain) |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Optional | Not needed for CI read-only sync |
| `NEXT_PUBLIC_GA_TRACKING_ID` | Optional | Analytics |
| `NEXT_PUBLIC_COMMENTBOX_PROJECT_ID` | Optional | Comments |

Or set via CLI (replace values):

```powershell
npx vercel env add CONTENTFUL_SPACE_ID production
npx vercel env add CONTENTFUL_ACCESS_TOKEN production
npx vercel env add CONTENTFUL_ENVIRONMENT production
npx vercel env add NEXT_PUBLIC_BASE_URL production
npx vercel env add NEXT_PUBLIC_BASE_PATH production
```

After changing env vars, **redeploy**.

---

## 5. Deploy

**Preview (draft URL):**

```powershell
npx vercel
```

**Production:**

```powershell
npx vercel --prod
```

Or connect the GitHub repo in the Vercel UI (**Add New Project → Import**) so every push to `main` deploys automatically.

---

## 6. Contentful → auto-redeploy

Both hosts need their **own** rebuild trigger. Publishing in Contentful does **not** update a static host until that host rebuilds.

| Host | Trigger |
| --- | --- |
| GitHub Pages | Webhook **GitHub Pages redeploy** → `repository_dispatch` |
| Vercel | Webhook **Vercel redeploy** → Deploy Hook |

### Create / refresh the Vercel webhook

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
# Create hook (once) if you don't have the URL yet:
npx vercel deploy-hooks create contentful-publish --ref main

$env:VERCEL_DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/...."
npm run contentful:setup-vercel-webhook
```

After Publish in Contentful:

1. Contentful → Webhooks → **Vercel redeploy** → call log (expect **2xx**)
2. Vercel → Deployments → new build should appear
3. Hard-refresh https://insightswithme-blog.vercel.app

Treat the Deploy Hook URL like a secret (anyone with it can trigger deploys).

---

## 7. Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain and follow DNS instructions.  
Then set `NEXT_PUBLIC_BASE_URL` to that domain and redeploy.

---

## Local verify before deploy

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
npm run build
npx serve out
```

---

## Project files

| File | Role |
| --- | --- |
| `vercel.json` | Framework + build → `out` |
| `.vercel/` | Local link metadata (do not commit secrets; folder is gitignored) |
| `next.config.ts` | `output: "export"`, empty `basePath` on Vercel |

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Build fails on Contentful sync | Missing `CONTENTFUL_SPACE_ID` / `CONTENTFUL_ACCESS_TOKEN` in Vercel env |
| Wrong asset URLs / 404 CSS | Ensure `NEXT_PUBLIC_BASE_PATH` is empty on Vercel |
| Sitemap / canonical wrong | Set `NEXT_PUBLIC_BASE_URL` to the real Vercel (or custom) URL |
| CLI not logged in | `npx vercel login` again |
