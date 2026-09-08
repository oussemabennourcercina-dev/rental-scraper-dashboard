import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return new Pool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: parseInt(process.env.DB_PORT ?? "25432"),
    database: process.env.DB_NAME ?? "rental_scraper",
    user: process.env.DB_USER ?? "scraper",
    password: process.env.DB_PASSWORD ?? "ScraperDB2024",
    max: 5,
    idleTimeoutMillis: 30000,
  });
}

const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool;

export default pool;