import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("missing url", { status: 400 });

  // Normalize rule: replace $_74 / any invalid rule with $_57
  const url = raw.replace(/\?rule=\$_\d+\.[A-Z]+$/, "?rule=$_59.AUTO");

  try {
    const res = await fetch(url, {
      headers: {
        "Referer": "https://www.kleinanzeigen.de/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const buf = await res.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}