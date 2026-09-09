import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServiceStatus } from "@/lib/ssh";

export async function GET() {
  try {
    const [statsRes, jobRes, serviceStatus] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(price) AS with_price,
          COUNT(CASE WHEN first_seen_at >= NOW() - INTERVAL '24h' THEN 1 END) AS new_today,
          ROUND(AVG(price)::numeric, 0) AS avg_price,
          COUNT(CASE WHEN phone IS NOT NULL AND phone != 'N/A' THEN 1 END) AS with_phone,
          COUNT(CASE WHEN jsonb_array_length(images) > 0 THEN 1 END) AS with_photos
        FROM listings
      `),
      pool.query(`
        SELECT id, status, new_listings, updated_listings, skipped, errors,
               pages_scraped, started_at, finished_at,
               EXTRACT(EPOCH FROM (COALESCE(finished_at, NOW()) - started_at))::int AS duration_s
        FROM scraping_jobs
        ORDER BY id DESC
        LIMIT 1
      `),
      getServiceStatus().catch(() => "unknown" as const),
    ]);

    const stats = statsRes.rows[0];
    const lastJob = jobRes.rows[0] ?? null;

    return NextResponse.json({
      total:      parseInt(stats.total),
      withPrice:  parseInt(stats.with_price),
      newToday:   parseInt(stats.new_today),
      avgPrice:   stats.avg_price ? parseInt(stats.avg_price) : null,
      withPhone:  parseInt(stats.with_phone),
      withPhotos: parseInt(stats.with_photos),
      serviceStatus,
      lastJob,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}