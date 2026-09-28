# Contentful → GitHub Pages redeploy (end-to-end)

Complete integration guide for auto-redeploying this static site when content is published in Contentful.

**Live site:** https://insightswithme.github.io  
**Repo:** https://github.com/insightswithme/insightswithme.github.io  
**Space ID:** `7csiqfkqfved` (environment: `master`)  
**Webhook name:** `GitHub Pages redeploy`

---

## 1. Architecture (what happens)

```
Contentful Editor
      │  Publish / Unpublish / Delete entry
      ▼
Contentful Webhook  ("GitHub Pages redeploy")
      │  POST https://api.github.com/repos/insightswithme/insightswithme.github.io/dispatches
      │  Body: { "event_type": "contentful-publish", "client_payload": { "source": "contentful" } }
      ▼
GitHub repository_dispatch  (type: contentful-publish)
      ▼
Actions workflow  (.github/workflows/nextjs.yml)
      │  1) Sync CMS → content/generated/*.json  (Delivery API only in CI)
      │  2) next build (static export)
      │  3) Deploy artifact to GitHub Pages
      ▼
https://insightswithme.github.io
```

| Piece | Detail |
| --- | --- |
| Trigger topics | `Entry.publish`, `Entry.unpublish`, `Entry.delete` only (not Asset — avoids double deploys) |
| Event type | `contentful-publish` |
| Workflow file | `.github/workflows/nextjs.yml` |
| Setup script | `scripts/setup-contentful-deploy-webhook.mjs` |
| npm script | `npm run contentful:setup-webhook` |
| Concurrency | Group `github-pages`, `cancel-in-progress: true` |

**CI rule:** On GitHub Actions, sync scripts **must not** create/update/publish Contentful entries. They only **read** via the Delivery API and write local JSON. Writing+publishing from CI retriggers the webhook and causes an infinite deploy loop.

---

## 2. Prerequisites

| Credential | Where used | Notes |
| --- | --- | --- |
| `CONTENTFUL_SPACE_ID` | Local `.env.local` + GitHub Actions secrets | Space id |
| `CONTENTFUL_ACCESS_TOKEN` | Local + Actions secrets | Delivery (CDA) — used at **build** time |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Local + Actions secrets | CMA — local seed/setup only; skipped for writes in CI |
| `CONTENTFUL_ENVIRONMENT` | Local + Actions vars | Usually `master` |
| GitHub PAT (classic) `repo` | Stored **inside** the Contentful webhook `Authorization` header | Used only by Contentful → GitHub Dispatches |

GitHub Actions secrets / vars are configured under the repo **Settings → Secrets and variables → Actions** (and the `github-pages` environment if used).

---

## 3. One-time setup

### 3.1 Workflow already listens for dispatch

In `.github/workflows/nextjs.yml`:

```yaml
on:
  push:
    branches: ["main"]
  workflow_dispatch:
  repository_dispatch:
    types: [contentful-publish]
```

### 3.2 Create a GitHub Personal Access Token (classic)

1. Open https://github.com/settings/tokens/new (account that can write to `insightswithme/insightswithme.github.io`).
2. Note: e.g. `contentful-pages-deploy`.
3. Expiration: 90 days or as preferred.
4. Scope: check **`repo`**.
5. Generate and copy the `ghp_…` token (shown once).

Do **not** commit this token. Prefer a dedicated classic PAT over a short-lived `gho_…` CLI OAuth token.

### 3.3 Create / refresh the Contentful webhook

From the project root (`pawan-tyagi-blog`):

```powershell
cd c:\My_Blog_Post\pawan-tyagi-blog
$env:GITHUB_DISPATCH_TOKEN="ghp_YOUR_TOKEN_HERE"
npm run contentful:setup-webhook
```

Requires in `.env.local` (or env):

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_MANAGEMENT_TOKEN`

The script creates or updates webhook **GitHub Pages redeploy** with:

| Setting | Value |
| --- | --- |
| URL | `https://api.github.com/repos/insightswithme/insightswithme.github.io/dispatches` |
| Method | `POST` |
| Topics | Entry publish / unpublish / delete |
| Headers | `Accept`, `Authorization: Bearer <PAT>`, `X-GitHub-Api-Version`, `User-Agent` |
| Body (transformation) | JSON **object** (not a string): `{ "event_type": "contentful-publish", "client_payload": { "source": "contentful" } }` |

Manage in UI:  
https://app.contentful.com/spaces/7csiqfkqfved/settings/webhooks

---

## 4. Day-to-day publish flow

1. Edit an entry in Contentful.
2. Click **Publish** (or Unpublish / Delete).
3. Wait ~2–3 minutes for Actions + Pages.
4. Hard-refresh https://insightswithme.github.io

Actions:  
https://github.com/insightswithme/insightswithme.github.io/actions

---

## 5. Verify end-to-end (including call activity)

Use this checklist after setup or when debugging.

### Step A — Contentful webhook call activity

1. Open Contentful → **Settings → Webhooks**.
2. Open **GitHub Pages redeploy**.
3. Open **Activity** / call log for the latest request.
4. Confirm:

| Check | Expected |
| --- | --- |
| HTTP status | **204** (GitHub accepted `repository_dispatch`) |
| Request URL | `…/repos/insightswithme/insightswithme.github.io/dispatches` |
| `User-Agent` header | `Contentful-Webhook-GitHubPages-Redeploy` |
| `Authorization` | Present (`Bearer ghp_…`) — treat as secret; rotate if leaked in screenshots |
| Request body | A JSON **object** with `event_type` and `client_payload` (not a quoted string) |
| Topic | e.g. `ContentManagement.Entry.publish` |

If status is not 204, see [§7 Troubleshooting](#7-troubleshooting).

### Step B — GitHub Actions run

1. Open https://github.com/insightswithme/insightswithme.github.io/actions
2. Latest run should show:
   - Title / event: **`contentful-publish`** (repository_dispatch), or `push` / `workflow_dispatch`
   - Workflow: **Deploy Next.js site to Pages**
   - Jobs: **build** then **deploy** → conclusion **success**

### Step C — Live site

1. Hard-refresh https://insightswithme.github.io
2. Confirm the published content appears (may take a minute after deploy success).

### Step D — Manual test without editing content

```powershell
gh api repos/insightswithme/insightswithme.github.io/dispatches -f event_type=contentful-publish
```

Then check Actions for a new **contentful-publish** run.

---

## 6. Webhook payload contract (for further integrations)

GitHub expects exactly this shape for `POST /repos/{owner}/{repo}/dispatches`:

```json
{
  "event_type": "contentful-publish",
  "client_payload": {
    "source": "contentful"
  }
}
```

**Important (Contentful transformation):**

- `transformation.body` must be a **JSON object** in the webhook definition.
- If you store the body as a **string** of JSON, Contentful sends a JSON string and GitHub returns **HTTP 422** (`"… is not an object"`).

Required request headers:

```http
Accept: application/vnd.github+json
Authorization: Bearer <github_pat_with_repo_scope>
X-GitHub-Api-Version: 2022-11-28
User-Agent: Contentful-Webhook-GitHubPages-Redeploy
Content-Type: application/json
```

(`Content-Type` is set via `transformation.contentType` in our setup script.)

Optional: extend `client_payload` with ids for debugging (keep it small — GitHub limits payload size), e.g.:

```json
{
  "event_type": "contentful-publish",
  "client_payload": {
    "source": "contentful",
    "entryId": "{ /payload/sys/id }",
    "topic": "{ /topic }"
  }
}
```

Workflow can read these via `github.event.client_payload` if needed later.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Webhook **403**, body mentions User-Agent | Missing `User-Agent` | Re-run `npm run contentful:setup-webhook` |
| Webhook **401** | Expired / revoked PAT | New classic PAT with `repo`; re-run setup |
| Webhook **422** “is not an object” | Body sent as a JSON string | Ensure transformation `body` is an **object**; re-run setup |
| Webhook **204** but no Actions run | Wrong repo URL, wrong `event_type`, or workflow not on default branch | Confirm URL/repo, `contentful-publish` type, workflow on `main` |
| Two runs for one Publish | Asset + Entry topics, or manual dispatch + publish | Keep topics **Entry-only**; don’t double-test |
| Many cancelled runs / never finishes | Deploy loop: CI republishing Contentful entries | CI must skip CMA writes (`GITHUB_ACTIONS`); pause webhook until fixed |
| Build **429** RateLimitExceeded | Too many CMA calls from parallel/cancelled builds | Read-only CI sync; wait; avoid bulk publish storms |
| Site unchanged after green deploy | Cache / wrong CDN path | Hard-refresh; confirm Pages source is Actions |

### Pause / re-enable webhook

- UI: Contentful → Webhooks → **GitHub Pages redeploy** → toggle Active.
- Or re-run setup script (`active: true` in definition).

### Manual redeploy

Actions → **Deploy Next.js site to Pages** → **Run workflow**.

---

## 8. Related project scripts

| Script | Role |
| --- | --- |
| `scripts/setup-contentful-deploy-webhook.mjs` | Create/update webhook definition |
| `scripts/sync-contentful-nav-categories.mjs` | Nav + categories → `content/generated/` |
| `scripts/sync-contentful-pages.mjs` | Pages → `content/generated/pages.json` |
| `scripts/sync-contentful-portfolio.mjs` | Portfolio → `content/generated/portfolio.json` |
| `scripts/sync-contentful-footer.mjs` | Footer → `content/generated/footer.json` |
| `package.json` → `prebuild` | Runs all syncs + search index before `next build` |

Local `npm run dev` / `npm run build` may use CMA to seed missing types/entries. **GitHub Actions only fetches published content via Delivery API.**

---

## 9. Reusing this pattern on another repo / space

1. Copy workflow `repository_dispatch` trigger (`types: [your-event-name]`).
2. Copy/adapt `scripts/setup-contentful-deploy-webhook.mjs` (`REPO`, `EVENT_TYPE`, `WEBHOOK_NAME`).
3. Create classic PAT with `repo` on the target GitHub account.
4. Set Contentful CMA + space env vars; run the setup script.
5. Add Contentful Delivery (and any public) secrets to Actions.
6. Ensure build pipeline does **not** publish back to Contentful.
7. Walk [§5 Verify](#5-verify-end-to-end-including-call-activity) once.

---

## 10. Security notes

- Contentful webhook **call logs show the Authorization header**. Treat any pasted log as a leaked token → rotate the PAT.
- Prefer a dedicated classic PAT used only for this webhook.
- Never commit `.env.local`, PATs, or Management tokens.
- Rotate tokens when people leave or when a token appears in chat/screenshots.

---

## Quick links

| Resource | URL |
| --- | --- |
| Contentful webhooks | https://app.contentful.com/spaces/7csiqfkqfved/settings/webhooks |
| GitHub Actions | https://github.com/insightswithme/insightswithme.github.io/actions |
| Live site | https://insightswithme.github.io |
| Create classic PAT | https://github.com/settings/tokens/new |
| GitHub Dispatches API | https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event |
| Contentful webhook transforms | https://www.contentful.com/developers/docs/extensibility/webhooks/transformations/ |
