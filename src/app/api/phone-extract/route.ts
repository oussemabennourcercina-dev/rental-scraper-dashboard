import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Returns listings that likely have phone numbers (based on raw_data.phone_available)
// and haven't been enriched yet
export async function GET() {
  const { rows } = await pool.query(`
    SELECT source_id, url, title, city
    FROM listings
    WHERE phone IS NULL
      AND (raw_data->>'phone_available' = 'true' OR raw_data->>'phone_available' IS NULL)
      AND is_available = true
    ORDER BY first_seen_at DESC
    LIMIT 50
  `);
  return NextResponse.json({ listings: rows });
}

export async function POST(req: Request) {
  const { source_id, phone } = await req.json();
  if (!source_id || !phone) {
    return NextResponse.json({ error: "Missing source_id or phone" }, { status: 400 });
  }
  // Sanitize: keep only digits, +, spaces, hyphens
  const cleaned = phone.replace(/[^\d+\s\-()]/g, "").trim();
  if (cleaned.length < 6) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  await pool.query(
    "UPDATE listings SET phone = $1 WHERE source_id = $2",
    [cleaned, source_id]
  );
  return NextResponse.json({ ok: true, source_id, phone: cleaned });
}