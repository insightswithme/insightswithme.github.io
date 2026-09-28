# Auto-redeploy GitHub Pages when Contentful publishes

After you **Publish** (or unpublish/delete) content in Contentful, a webhook calls GitHub and runs **Deploy Next.js site to Pages**.

## One-time setup (already done if script succeeded)

1. Workflow listens for `repository_dispatch` type `contentful-publish`.
2. Contentful webhook **GitHub Pages redeploy** posts to GitHub Dispatches API.
3. GitHub token used by the webhook needs **`repo`** scope.

## Your day-to-day steps

1. Edit content in Contentful.
2. Click **Publish**.
3. Wait ~2–3 minutes.
4. Hard-refresh https://insightswithme.github.io

Check the run:  
https://github.com/insightswithme/insightswithme.github.io/actions

## If deploy does not start

1. Contentful → **Settings → Webhooks** → **GitHub Pages redeploy** → call logs (look for HTTP **204**).
2. **HTTP 403 / User-Agent**: webhook must send header `User-Agent: Contentful-Webhook-GitHubPages-Redeploy` (re-run setup script).
3. **HTTP 401**: GitHub token expired — create a classic PAT with **`repo`** scope and re-run setup.
4. You can always redeploy manually: Actions → **Deploy Next.js site to Pages** → **Run workflow**.

## Recreate / refresh the webhook

1. Create a GitHub **Personal Access Token (classic)** with scope **`repo`**:  
   https://github.com/settings/tokens  
   Name it e.g. `contentful-pages-deploy`.
2. In PowerShell from the project folder:

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
$env:GITHUB_DISPATCH_TOKEN="ghp_YOUR_TOKEN_HERE"
node scripts/setup-contentful-deploy-webhook.mjs
```

Or with GitHub CLI (uses your logged-in token):

```powershell
$env:GH_TOKEN=(gh auth token)
node scripts/setup-contentful-deploy-webhook.mjs
```

## Test without editing content

```powershell
gh api repos/insightswithme/insightswithme.github.io/dispatches -f event_type=contentful-publish
```

Then open the Actions tab — a new deploy should appear.
