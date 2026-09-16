# netlify-edge-functions-test

A minimal TypeScript API for testing Netlify Edge Functions. Built with
[Hono](https://hono.dev) and deployed to **Netlify**.

> The **Edge Functions** runtime (Deno) has no raw TCP sockets, so `pg` cannot
> connect from `netlify/edge-functions/`. Postgres access therefore lives in a
> separate **Netlify Function (Node.js runtime)** at `netlify/functions/db.ts`,
> which can open TCP to the Aiven database. The edge function excludes those paths
> so the Node function handles them.

## Stack

| Piece | Choice |
|-------|--------|
| Runtime (edge routes) | Netlify Edge Functions (Deno) |
| Runtime (DB routes) | Netlify Functions (Node.js) |
| Language | TypeScript |
| HTTP | Hono via `hono/netlify` |
| Database | Postgres (Aiven) via `pg` connection pool |
| Local dev | `netlify dev` |
| CI/CD | Netlify Git integration on push |

## Endpoints

| Method | Path | Runtime | Description |
|--------|------|---------|-------------|
| `GET` | `/` | Edge | Service status, name, runtime, and current time |
| `GET` | `/healthz` | Edge | Liveness check, always returns `200` |
| `GET` | `/api/geo` | Edge | Geolocation derived from the edge request context |
| `GET` | `/api/echo` | Edge | Echoes the request method, path, and headers |
| `GET` | `/api/db/ping` | Node | Runs `SELECT 1` to verify the database connection |
| `GET` | `/api/my_new_table` | Node | Returns all rows from `my_new_table` |

## Project layout

```
netlify/edge-functions/index.ts   Hono app + Netlify edge handler
netlify/functions/db.ts           Node.js function: pg pool and DB routes
netlify.toml                      Build/publish configuration
public/index.html                 Static fallback (the edge function handles /*)
tsconfig.json                     Type-checking only; Netlify bundles the functions
AGENTS.md                         Rules for AI agents working in this repo
```

The edge function declares `config.path = "/*"` so the Hono app handles every
route, but lists the DB paths in `excludedPath` so the Node function receives them
instead.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | - | Postgres connection string, e.g. `postgres://user:pass@host:port/dbname?sslmode=require` |
| `PG_POOL_MAX` | no | `5` | Maximum pool size |

Set `DATABASE_URL` in the Netlify site's **Site configuration -> Environment
variables** for all deploy contexts. SSL is enabled automatically when the URL
contains `sslmode` or points at a `*.aivencloud.com` host.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:8888`. The Netlify CLI runs both the edge function and
the Node function locally. Use `netlify dev --geo=mock --country=US` to mock
geolocation, since the local `geo` data otherwise reflects your machine. The
`DATABASE_URL` set in the Netlify UI is not available locally; copy `.env.example`
to `.env` (gitignored) to test the DB routes.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Type-check (required by Netlify's default build command) |
| `npm run dev` | Start the Netlify dev server |
| `npm run typecheck` | Type-check without emitting files |
| `npm run deploy` | Deploy to production with the Netlify CLI |

## Deployment

Connect this repository to a Netlify site and push. Netlify runs `npm run build`
and deploys the edge function and Node function along with the site.

## Known gotchas

- **Edge functions have no URL route by default.** Unlike regular functions, they
  are not auto-assigned a path. The inline `config.path = "/*"` in
  `netlify/edge-functions/index.ts` is what makes the Hono app handle every route.
- **The edge function shadows the Node function unless excluded.** An edge function
  that returns a response ends the request chain, so the DB paths must be listed in
  `excludedPath` for `netlify/functions/db.ts` to run.
- **No Node.js APIs and no TCP in edge functions.** The edge runtime is Deno-based:
  Node built-ins and raw sockets (including `pg`) are unavailable. `pg` runs only in
  the Node function.
- **Use Aiven's connection pooler endpoint.** Netlify Functions scale by starting new
  instances, each holding its own pool; keep `PG_POOL_MAX` small.
- **CPU time per request is 50 ms** for edge functions. Time waiting on I/O is not
  counted, but keep handlers small.

## Notes

- ESM only.
- See `AGENTS.md` for repository rules, including the no-deploy policy for agents.
