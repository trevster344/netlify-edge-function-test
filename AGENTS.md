# Netlify Edge Functions (Hono, Deno runtime)

TypeScript API built with Hono and deployed to Netlify as an **Edge Function**.
The function lives at `netlify/edge-functions/index.ts` and runs on every path.

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
development (`npm run dev`) and static inspection (`npm run typecheck`, reading
files, `git status`) are fine.

## Always check current Netlify documentation

Your knowledge of Netlify may be outdated. Before any task involving Edge
Functions, declarations, routing, environment variables, or limits, **retrieve the
current documentation first** rather than relying on memory.

Retrieve from the official docs:

- Edge Functions overview: https://docs.netlify.com/build/edge-functions/overview/
- Get started: https://docs.netlify.com/build/edge-functions/get-started/
- Declarations: https://docs.netlify.com/build/edge-functions/declarations/
- API reference: https://docs.netlify.com/build/edge-functions/api/
- Limits: https://docs.netlify.com/build/edge-functions/limits/
- Environment variables: https://docs.netlify.com/build/edge-functions/environment-variables/

For limits and quotas, always read the current docs page rather than quoting
remembered values.

## Runtime contract (Netlify Edge Functions)

- The runtime is **Deno-based** and runs at the network edge, not Node.js.
- **No raw TCP sockets**, so `pg` cannot connect to Aiven. This project intentionally
  has no database access. Use the Cloud Run or Vercel sibling projects for Postgres.
- Only web-standard APIs and `fetch` are available; Node built-ins are unavailable.
- CPU time per request is limited to 50 ms (I/O wait is not counted).
- Edge functions are **not auto-assigned a route**; the inline `config.path` in the
  function file (or a `[[edge_functions]]` entry in `netlify.toml`) declares it.
- `c.env.context` exposes the Netlify `Context` (including `geo`).

## Repository layout

| Path | Purpose |
|------|---------|
| `netlify/edge-functions/index.ts` | Hono app and the Netlify edge function handler |
| `netlify.toml` | Build/publish configuration |
| `public/index.html` | Static fallback; the edge function handles `/*` |
| `tsconfig.json` | Type-checking only; Netlify bundles the function with esbuild |

## Conventions

- ESM only.
- The Hono handler is exported with `export default handle(app)` from `hono/netlify`.
- Keep `export const config: Config = { path: "/*" }` so the app serves all routes.
- Do not add comments to code unless explicitly asked.
