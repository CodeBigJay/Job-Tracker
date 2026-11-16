# Cloudflare deployment preparation

This folder prepares the Cloudflare deployment path for Job Tracker. **It is not deployed yet.** The Cloudflare Worker API still needs to be implemented and tested before the frontend is pointed at it.

The existing Spring Boot + PostgreSQL backend remains available for local development. Do not remove it during the migration.

## Target architecture

| Part | Cloudflare service | Purpose |
|---|---|---|
| React + Vite frontend | Cloudflare Pages | Static site on a `pages.dev` address |
| TypeScript API | Cloudflare Workers | Authentication and application API |
| SQL database | Cloudflare D1 | Users, applications, interviews, notes and reminders |

The plan uses the free service tiers, the provider subdomains, and no paid AI API. It is **R0 only while usage stays within the free limits**; provider terms and quotas can change. No custom domain is required.

## Important branch protection for this project

All deployment preparation is being made on `feature/cloudflare-free-deployment`. Keep `main` unchanged until the feature branch has passed the checks and the owner explicitly approves a merge.

When creating the Pages project, choose `feature/cloudflare-free-deployment` as its production branch. Do not select `main`.

## Stage 1 — Create or sign in to Cloudflare

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Sign in, or create a Cloudflare account and choose the Free plan.
3. Open **Workers & Pages**.
4. Do not enter passwords, one-time verification codes, API tokens, or secret values into a chat. Enter them only in the official Cloudflare/GitHub screens where required.

## Stage 2 — Connect the GitHub repository to Pages

The repository is `CodeBigJay/Job-Tracker`.

1. In **Workers & Pages**, choose **Create application** → **Pages** → **Connect to Git**.
2. Choose GitHub. If prompted, install and authorize the **Cloudflare Workers and Pages** GitHub App.
3. Grant access to **Only select repositories** and select `CodeBigJay/Job-Tracker`, rather than granting access to every repository.
4. Select `CodeBigJay/Job-Tracker`.
5. Set the production branch to `feature/cloudflare-free-deployment`.
6. Use these Vite build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Vite |
   | Root directory | `job-application-tracker/frontend` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

7. Do not set `VITE_API_BASE_URL` to `http://localhost:8080`. The frontend must receive the deployed Worker URL after the Worker API is implemented and verified.
8. If Pages starts its first build before the API is ready, treat it as a frontend build check only. It is not a working full-stack deployment yet.

Cloudflare's Git integration supports a non-default production branch and branch preview deployments. The selected branch is what protects the existing `main` branch from becoming the production source.

## Stage 3 — Create the D1 database

Create a database named `jobtracker-db` from **Workers & Pages** → **D1 SQL Database** → **Create database**.

Keep the database ID for the local Wrangler configuration. A database ID is configuration, not an API secret, but it does not need to be posted in chat.

The initial schema is in:

```text
migrations/0001_initial_schema.sql
```

After the Worker project and its Wrangler configuration are in place, apply the migration with Wrangler:

```powershell
npx wrangler d1 migrations apply jobtracker-db --remote
```

Do not run this against a production database until the database name and binding have been checked. The schema uses foreign keys with cascading deletes and indexes for user-scoped application and child-record queries.

## Stage 4 — Worker setup (next implementation stage)

The example Wrangler configuration is:

```text
wrangler.toml.example
```

After creating D1, copy it to `wrangler.toml` and replace the database ID with the value returned by Cloudflare. The Worker entry point and API routes still need to be added and tested before deployment.

The Worker must preserve the current frontend's API contract:

- `POST /api/auth/register` and `POST /api/auth/login`
- Application list/create/read/update/delete
- Dashboard status counts
- Application notes
- Interview scheduling and completion
- Reminders and completion
- Per-user data isolation on every protected route

The migration will use Web Crypto for password hashing and JWT signing. The JWT signing key must be stored as a Worker secret (for example, with Wrangler's secret command or the Cloudflare dashboard), never in source code, frontend variables, or this repository.

## Stage 5 — Full-stack verification before calling it live

The deployment is not complete until all of these checks pass:

- Pages build succeeds from the selected feature branch.
- Worker health endpoint responds over HTTPS.
- Registration and login work against D1.
- A signed-in user can create, list, edit and delete an application.
- Dashboard counts match the saved applications.
- Notes, interviews and reminders can be created, listed, updated where supported, and deleted.
- A second test account cannot read or modify the first account's records.
- CORS permits the Pages origin and rejects unapproved origins.
- The frontend uses the deployed Worker URL, not localhost.
- A real Pages URL and Worker URL have been opened and tested.

Do not use real personal information for deployment smoke tests. Use a disposable test account and remove its test records afterward.

## Free-tier guardrails

The current published limits include:

- Pages Free: 500 builds per month, one concurrent build, 20-minute build timeout, up to 20,000 files per site, and a 25 MiB maximum per asset.
- Workers Free: 100,000 requests per day and 10 ms CPU time per invocation.
- D1 Free: 5 GB total storage, 5 million rows read per day, and 100,000 rows written per day. Daily read/write limits are enforced; queries can fail until the daily reset if an account exceeds them.

Keep database queries indexed and avoid unnecessary polling. These are current published quotas, not a promise of unlimited free hosting.

## Current status

- [x] Feature branch exists.
- [x] Pages build settings documented.
- [x] Initial D1 schema prepared.
- [ ] Cloudflare account connected by the owner.
- [ ] Pages GitHub integration authorized and configured.
- [ ] Worker API implemented and tested.
- [ ] D1 database created and migration applied.
- [ ] Worker deployed and HTTPS health check passed.
- [ ] Pages deployed with the verified Worker API URL.
- [ ] Full end-to-end and account-isolation checks passed.
