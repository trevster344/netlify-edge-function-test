# Netlify Edge Functions + Node Function (Hono, Aiven Postgres)

TypeScript API built with Hono and deployed to Netlify. Most routes run as an
**Edge Function** at `netlify/edge-functions/index.ts`; the Postgres routes run as a
**Netlify Function (Node.js runtime)** at `netlify/functions/db.ts`, which uses `pg`
to reach Aiven through `DATABASE_URL`.

## STOP - Deployments are not allowed

Do **not** run any deploy command. This includes, but is not limited to:

| Command | Status |
|---------|--------|
| `npm run deploy` / `netlify deploy` | forbidden |
| `netlify deploy --prod` | forbidden |
| `netlify deploy` | forbidden |
| `netlify link` | forbidden |
| `netlify build` | forbidden |

Deployments happen only through the Netlify Git integration after a push. If a task
appears to require a deploy, stop and report instead of running it. Local
development (`npm run dev`) and static inspection (`npm run build`,
`npm run typecheck`, reading files, `git status`) are fine.

## Always check current Netlify documentation

Your knowledge of Netlify may be outdated. Before any task involving Edge
Functions, Functions, declarations, routing, environment variables, or limits,
**retrieve the current documentation first** rather than relying on memory.

Retrieve from the official docs:

- Edge Functions overview: https://docs.netlify.com/build/edge-functions/overview/
- Edge Function declarations: https://docs.netlify.com/build/edge-functions/declarations/
- Edge Functions limits: https://docs.netlify.com/build/edge-functions/limits/
- Functions overview: https://docs.netlify.com/build/functions/overview/
- Functions API: https://docs.netlify.com/build/functions/api/
- Environment variables: https://docs.netlify.com/build/edge-functions/environment-variables/

For limits and quotas, always read the current docs page rather than quoting
remembered values.

## Runtime contract

- **Edge routes** (`netlify/edge-functions/index.ts`) run on a **Deno-based**
  runtime at the network edge, not Node.js. No raw TCP sockets, so `pg` cannot run
  there. Only web-standard APIs and `fetch` are available. CPU time per request is
  50 ms (I/O wait is not counted).
- **DB routes** (`netlify/functions/db.ts`) run on the **Node.js** runtime, where
  `pg` and `process.env` are available.
- Edge functions are **not auto-assigned a route**; the inline `config.path` (or a
  `[[edge_functions]]` entry in `netlify.toml`) declares it.
- The edge function must keep the DB paths in `excludedPath`. An edge function that
  returns a response ends the request chain, so without the exclusion the Node
  function would never run.
- `c.env.context` in the edge app exposes the Netlify `Context` (including `geo`).

## Repository layout

| Path | Purpose |
|------|---------|
| `netlify/edge-functions/index.ts` | Hono app and the edge function handler |
| `netlify/functions/db.ts` | Node function: `pg` pool and the Postgres routes |
| `netlify.toml` | Build/publish configuration |
| `public/index.html` | Static fallback; the edge function handles `/*` |
| `tsconfig.json` | Type-checking only; Netlify bundles the functions with esbuild |

## Deployment facts

- `DATABASE_URL` must be set on the Netlify site for all deploy contexts.
  `netlify/functions/db.ts` throws at import time when it is missing.
- Aiven's IP allowlist must permit Netlify's egress, or the connection is refused.
- Prefer Aiven's connection pooler endpoint and keep `PG_POOL_MAX` small, since each
  function instance holds its own pool.
- A push to the connected branch triggers the Netlify build and deploy.
- Keep `typescript` pinned to `5.9.3`, not 7.x. Netlify's build tooling
  (`@netlify/build` -> `ts-node`, `zip-it-and-ship-it` -> `typescript-eslint`) loads
  TypeScript from `node_modules`; TypeScript 7's Go-native rewrite dropped the JS enum
  exports it reads, so a hoisted `typescript@7` fails the deploy with
  `Cannot read properties of undefined (reading 'Intrinsic')`.

## Conventions

- ESM only.
- The edge handler is exported with `export default handle(app)` from `hono/netlify`.
- Keep `export const config: Config = { path: "/*", excludedPath: [...] }` in the
  edge function so the app serves all routes except the DB paths.
- Never commit `.env` or `DATABASE_URL`; only `.env.example` is tracked.
- Do not add comments to code unless explicitly asked.
