import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  const city      = sp.get("city") ?? "";
  const minPrice  = sp.get("minPrice")  ? parseFloat(sp.get("minPrice")!)  : null;
  const maxPrice  = sp.get("maxPrice")  ? parseFloat(sp.get("maxPrice")!)  : null;
  const rooms     = sp.get("rooms")     ? parseFloat(sp.get("rooms")!)     : null;
  const hasPhone  = sp.get("hasPhone")  === "1";
  const hasPhoto  = sp.get("hasPhoto")  === "1";
  const balcony   = sp.get("balcony")   === "1";
  const furnished = sp.get("furnished") === "1";

  const conditions: string[] = ["is_available = true"];
  const params: (string | number)[] = [];
  let i = 1;

  if (city)           { conditions.push(`(city ILIKE $${i} OR zip_code ILIKE $${i})`); params.push(`%${city}%`); i++; }
  if (minPrice !== null) { conditions.push(`price >= $${i++}`); params.push(minPrice); }
  if (maxPrice !== null) { conditions.push(`price <= $${i++}`); params.push(maxPrice); }
  if (rooms !== null)    { conditions.push(`rooms >= $${i++}`); params.push(rooms); }
  if (hasPhone)          { conditions.push(`phone IS NOT NULL AND phone != 'N/A'`); }
  if (hasPhoto)          { conditions.push(`jsonb_array_length(images) > 0`); }
  if (balcony)           { conditions.push(`balcony = true`); }
  if (furnished)         { conditions.push(`furnished = true`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM listings ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT source_id, title, price, price_raw, warm_rent, city, zip_code,
              rooms, size_m2, floor_number, deposit, utilities,
              url, first_seen_at, posted_at, images, phone,
              balcony, terrace, garden, cellar, furnished, pets_allowed,
              heating_type, available_from, property_type, seller_name
       FROM listings
       ${where}
       ORDER BY first_seen_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({ listings: rows, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}