import { NextResponse } from "next/server";

// Called by Vercel Cron every day to prevent Supabase from pausing the project.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/foods?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  return NextResponse.json({ ok: res.ok, status: res.status });
}
