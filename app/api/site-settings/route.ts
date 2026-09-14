import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){try{const sql=db();const rows=await sql`SELECT announcement_enabled,announcement_message,announcement_items FROM site_settings WHERE id='default' LIMIT 1`;const r=rows[0];return NextResponse.json({enabled:r?Boolean(r.announcement_enabled):true,message:r?String(r.announcement_message):'🚚 Free shipping on orders above ₹499',items:r&&Array.isArray(r.announcement_items)?r.announcement_items:['Premium Assam Tea Blends','Order on WhatsApp']});}catch(e){return NextResponse.json({enabled:true,message:'🚚 Free shipping on orders above ₹499',items:['Premium Assam Tea Blends','Order on WhatsApp']});}}
