import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isSupabaseConfigured =
    Boolean(supabaseUrl && supabaseKey) &&
    !supabaseUrl?.includes("your-project-ref") &&
    !supabaseKey?.includes("your-anon-key");

  return NextResponse.json({
    status: "ok",
    runtime: "nodejs",
    nodeVersion: process.version,
    supabaseConfigured: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  });
}
