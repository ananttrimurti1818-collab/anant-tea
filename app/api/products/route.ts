import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json({ products: await getProducts() }); }
  catch (error) { console.error("GET /api/products failed", error); return NextResponse.json({ error: "Unable to load products." }, { status: 500 }); }
}
