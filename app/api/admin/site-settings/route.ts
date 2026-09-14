import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const fallback = { enabled: true, message: "🚚 Free shipping on orders above ₹499", items: ["Premium Assam Tea Blends", "Order on WhatsApp"] };
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied; try { const sql=db(); const rows=await sql`SELECT announcement_enabled,announcement_message,announcement_items FROM site_settings WHERE id='default' LIMIT 1`; const r=rows[0]; return NextResponse.json({settings:r?{enabled:Boolean(r.announcement_enabled),message:String(r.announcement_message),items:Array.isArray(r.announcement_items)?r.announcement_items:[]}:fallback}); } catch(e){return NextResponse.json({settings:fallback});} }
export async function PATCH(req:NextRequest){
  const denied = await requireAdmin();
  if (denied) return denied;try{const b=await req.json();const enabled=Boolean(b.enabled);const message=typeof b.message==='string'?b.message.trim():fallback.message;const items=Array.isArray(b.items)?b.items.map((x:unknown)=>String(x).trim()).filter(Boolean).slice(0,5):[];const sql=db();await sql`INSERT INTO site_settings(id,announcement_enabled,announcement_message,announcement_items,updated_at) VALUES('default',${enabled},${message},${JSON.stringify(items)}::jsonb,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET announcement_enabled=EXCLUDED.announcement_enabled,announcement_message=EXCLUDED.announcement_message,announcement_items=EXCLUDED.announcement_items,updated_at=CURRENT_TIMESTAMP`;return NextResponse.json({success:true,settings:{enabled,message,items}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save header settings.'},{status:500});}}
