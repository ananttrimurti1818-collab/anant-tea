import { NextResponse } from "next/server";
import { getCategories } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json({ categories: await getCategories() }); }
  catch (error) { console.error("GET /api/categories failed", error); return NextResponse.json({ error: "Unable to load categories." }, { status: 500 }); }
}
