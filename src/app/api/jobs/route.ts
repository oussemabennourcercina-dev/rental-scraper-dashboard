import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        id, status, new_listings, updated_listings, skipped, errors,
        pages_scraped, started_at, finished_at,
        EXTRACT(EPOCH FROM (COALESCE(finished_at, NOW()) - started_at))::int AS duration_s,
        error_log
      FROM scraping_jobs
      ORDER BY id DESC
      LIMIT 20
    `);
    return NextResponse.json({ jobs: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}