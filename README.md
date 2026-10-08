# Eaglenet

Rice mill management platform: an offline-first operator PWA, an owner dashboard, and a shared Supabase backend. Product context lives in `PRODUCT.md` and `DESIGN.md` — this doc is about building and deploying.

## Repo layout

- `app/` — operator PWA (React + TypeScript + Vite). Used by operators and employees on their phones: entries, sales, purchases, expenses, time clock.
- `dashboard/` — owner dashboard (React + TypeScript + Vite). Real-time view of everything, plus admin actions (creating accounts, clearing demo data).
- `supabase/` — Postgres schema (`migrations/`) and edge functions (`functions/`), shared by both apps.

## Prerequisites

- Node (both apps use Vite 8 / React 19 — check `app/package.json` / `dashboard/package.json` for exact versions if something won't install).
- `app/.env` and `dashboard/.env` (copy from the `.env.example` in each folder): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Root `.env`: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — only needed to deploy `dashboard/` manually (see below).
- Supabase CLI access, to push migrations or deploy functions: `npx supabase login` opens a browser flow, but that doesn't work in a non-TTY environment. In that case, generate a personal access token at supabase.com/dashboard/account/tokens and run `npx supabase login --token <token>` instead.

## Local dev

```
cd app && npm install && npm run dev
cd dashboard && npm install && npm run dev
```

## Build + checks

Run from inside `app/` or `dashboard/`:

```
npx tsc -b        # typecheck
npx oxlint        # lint
npm run build     # outputs to dist/
```

## Deploying

### `app/` → Cloudflare Pages project `eaglenet-excel`

Git-connected: pushing to `main` on GitHub triggers an automatic build and deploy. No manual step needed. Live at `operator.eaglenet.ca` (and `eaglenet-excel.pages.dev`).

### `dashboard/` → Cloudflare Pages project `eaglenet-dashboard`

**Not** git-connected — push to `main` does nothing here. Deploy manually after building:

```
cd dashboard
npm run build
set -a && source ../.env && set +a
npx wrangler pages deploy dist --project-name=eaglenet-dashboard --commit-dirty=true
```

Live at `admin.eaglenet.ca` (and `eaglenet-dashboard.pages.dev`).

After either deploy, propagation can lag a few seconds — verify by comparing the `index-*.js` hash in the local `dist/index.html` to what's served live (`curl -s https://<domain>/ | grep -o 'index-[A-Za-z0-9]*\.js'`), and recheck once if they don't match yet.

### `supabase/` — migrations and edge functions

The project is already linked locally (`supabase/.temp/project-ref`), ref `bfsealziavsrlkqeewvp`. After `supabase login` (see Prerequisites):

```
npx supabase db push --project-ref bfsealziavsrlkqeewvp
npx supabase functions deploy <function-name> --project-ref bfsealziavsrlkqeewvp
```

For one-off checks or data fixes against the live database:

```
npx supabase db query --linked --project-ref bfsealziavsrlkqeewvp "select ..."
```

## Reference

| App | Cloudflare project | Domain | Deploys on push to `main`? |
|---|---|---|---|
| `app/` | `eaglenet-excel` | operator.eaglenet.ca | Yes |
| `dashboard/` | `eaglenet-dashboard` | admin.eaglenet.ca | No — manual `wrangler pages deploy` |

Supabase project: `bfsealziavsrlkqeewvp` (region eu-west-2).
