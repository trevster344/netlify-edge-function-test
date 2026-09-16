import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/netlify";
import type { Config, Context } from "@netlify/edge-functions";

type Env = {
  context: Context;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", (c) =>
  c.json({
    status: "ok",
    service: "netlify-edge-functions-test",
    runtime: "edge",
    time: new Date().toISOString(),
  }),
);

app.get("/healthz", (c) => c.json({ status: "ok" }));

app.get("/api/geo", (c) => {
  const { geo } = c.env.context;
  return c.json({
    country: geo.country?.name ?? null,
    city: geo.city ?? null,
    subdivision: geo.subdivision?.name ?? null,
    timezone: geo.timezone ?? null,
  });
});

app.get("/api/echo", (c) =>
  c.json({
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    headers: Object.fromEntries(c.req.raw.headers),
  }),
);

export default handle(app);

export const config: Config = {
  path: "/*",
  excludedPath: ["/api/db/*", "/api/my_new_table"],
};
