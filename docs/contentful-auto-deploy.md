# Auto-redeploy GitHub Pages when Contentful publishes

> **Full end-to-end guide (setup, call activity, troubleshooting, reuse):**  
> **[contentful-github-pages-redeploy.md](./contentful-github-pages-redeploy.md)**  
> **Vercel host:** [vercel-deploy.md](./vercel-deploy.md) (needs its own **Vercel redeploy** webhook)

After you **Publish** (or unpublish/delete) an entry in Contentful:

| Host | Webhook | Result |
| --- | --- | --- |
| GitHub Pages | **GitHub Pages redeploy** | Rebuilds https://insightswithme.github.io |
| Vercel | **Vercel redeploy** | Rebuilds https://insightswithme-blog.vercel.app |

Both are static builds — CMS publish alone does not change a host until that host’s webhook fires a rebuild.

## Quick day-to-day

1. Edit → **Publish** in Contentful.
2. Check call activity: **Settings → Webhooks → GitHub Pages redeploy** → expect **HTTP 204**.
3. Check Actions: https://github.com/insightswithme/insightswithme.github.io/actions
4. Hard-refresh https://insightswithme.github.io (~2–3 min).

## Refresh webhook

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
$env:GITHUB_DISPATCH_TOKEN="ghp_YOUR_TOKEN_HERE"
npm run contentful:setup-webhook
```

## Manual test

```powershell
gh api repos/insightswithme/insightswithme.github.io/dispatches -f event_type=contentful-publish
```
