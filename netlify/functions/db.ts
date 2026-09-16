import { Pool } from "pg";
import type { Config } from "@netlify/functions";

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(rawConnectionString);
const sslMode = url.searchParams.get("sslmode");

const requiresSsl = sslMode !== null || url.hostname.endsWith("aivencloud.com");

if (sslMode !== null) {
  url.searchParams.delete("sslmode");
}

const pool = new Pool({
  connectionString: url.toString(),
  max: Number(process.env.PG_POOL_MAX ?? 5),
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
});

const headers = { "Access-Control-Allow-Origin": "*" };

export default async (req: Request) => {
  const { pathname } = new URL(req.url);

  try {
    if (pathname === "/api/db/ping") {
      const result = await pool.query("SELECT 1 AS ok");
      return Response.json({ ok: result.rows[0]?.ok === 1 }, { headers });
    }

    const result = await pool.query("SELECT * FROM my_new_table");
    return Response.json(result.rows, { headers });
  } catch {
    return Response.json({ error: "Database error" }, { status: 500, headers });
  }
};

export const config: Config = {
  path: ["/api/db/ping", "/api/my_new_table"],
};
