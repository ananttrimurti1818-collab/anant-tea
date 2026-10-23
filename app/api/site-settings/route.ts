import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const fallback = {
  enabled: true, message: "🚚 Free shipping on orders above ₹499",
  items: ["Premium Assam Tea Blends", "Order on WhatsApp"],
  shippingCharge: 60, freeShippingAbove: 499, codEnabled: true,
};
export async function GET() {
  try {
    const sql = db();
    const rows = await sql`SELECT announcement_enabled, announcement_message, announcement_items, shipping_charge, free_shipping_above, cod_enabled FROM site_settings WHERE id='default' LIMIT 1`;
    const r = rows[0];
    return NextResponse.json(r ? {
      enabled: Boolean(r.announcement_enabled),
      message: String(r.announcement_message || ""),
      items: Array.isArray(r.announcement_items) ? r.announcement_items : [],
      shippingCharge: Number(r.shipping_charge ?? fallback.shippingCharge),
      freeShippingAbove: Number(r.free_shipping_above ?? fallback.freeShippingAbove),
      codEnabled: r.cod_enabled === undefined ? true : Boolean(r.cod_enabled),
    } : fallback);
  } catch {
    return NextResponse.json(fallback);
  }
}
