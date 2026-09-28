# Auto-redeploy GitHub Pages when Contentful publishes

> **Full end-to-end guide (setup, call activity, troubleshooting, reuse):**  
> **[contentful-github-pages-redeploy.md](./contentful-github-pages-redeploy.md)**

After you **Publish** (or unpublish/delete) an entry in Contentful, webhook **GitHub Pages redeploy** calls GitHub `repository_dispatch` and runs **Deploy Next.js site to Pages**.

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
