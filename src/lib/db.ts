import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  const isProd = process.env.NODE_ENV === "production";
  return new Pool({
    host:     isProd ? "37.187.39.209" : "127.0.0.1",
    port:     isProd ? 15432 : 25432,
    database: "rental_scraper",
    user:     "scraper",
    password: "ScraperDB2024",
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool;

export default pool;