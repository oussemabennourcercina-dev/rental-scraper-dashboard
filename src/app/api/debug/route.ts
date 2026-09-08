import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? "***set***" : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "NOT SET",
    PGHOST: process.env.PGHOST,
    NODE_ENV: process.env.NODE_ENV,
  });
}