# netlify-edge-functions-test

A minimal TypeScript API for testing Netlify Edge Functions. Built with
[Hono](https://hono.dev) and deployed to **Netlify**.

> This project targets the **Edge Functions** runtime (Deno). It intentionally has
> **no database access**: the edge runtime has no raw TCP sockets, so `pg` cannot
> reach the Aiven Postgres instance used by the sibling projects. Routes that need
> Postgres live in `google-cloud-services-aiven-hobby0` (Cloud Run) or
> `vercel-functions-test` (Vercel Functions, Node.js).

## Stack

| Piece | Choice |
|-------|--------|
| Runtime | Netlify Edge Functions (Deno) |
| Language | TypeScript |
| HTTP | Hono via `hono/netlify` |
| Local dev | `netlify dev` |
| CI/CD | Netlify Git integration on push |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service status, name, runtime, and current time |
| `GET` | `/healthz` | Liveness check, always returns `200` |
| `GET` | `/api/geo` | Geolocation derived from the edge request context |
| `GET` | `/api/echo` | Echoes the request method, path, and headers |

## Project layout

```
netlify/edge-functions/index.ts   Hono app + Netlify handler (the edge function)
netlify.toml                      Build/publish configuration
public/index.html                 Static fallback (the edge function handles /*)
tsconfig.json                     Type-checking only; Netlify bundles the function
AGENTS.md                         Rules for AI agents working in this repo
```

The edge function is discovered at `netlify/edge-functions/index.ts`. It declares
`export const config: Config = { path: "/*" }` so it runs on every path.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:8888`. The Netlify CLI executes the edge function
locally. Use `netlify dev --geo=mock --country=US` to mock geolocation, since the
local `geo` data otherwise reflects your machine.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Netlify dev server (edge functions run locally) |
| `npm run typecheck` | Type-check without emitting files |
| `npm run deploy` | Deploy to production with the Netlify CLI |

## Deployment

Connect this repository to a Netlify site and push. Netlify builds and deploys the
edge function along with the site; no environment variables are required.

## Known gotchas

- **Edge functions have no URL route by default.** Unlike regular functions, they
  are not auto-assigned a path. The inline `config.path = "/*"` in
  `netlify/edge-functions/index.ts` is what makes the Hono app handle every route.
- **No Node.js APIs and no TCP.** The runtime is Deno-based: Node built-ins and raw
  sockets (including `pg`) are unavailable. Only web-standard APIs and `fetch` work.
- **CPU time per request is 50 ms.** Time spent waiting on I/O is not counted, but
  keep handlers small.
- **npm dependencies are bundled.** `hono` is ESM and edge-compatible, so it works;
  avoid packages that rely on Node built-ins.

## Notes

- ESM only.
- The edge function is stateless; nothing is persisted.
- See `AGENTS.md` for repository rules, including the no-deploy policy for agents.
