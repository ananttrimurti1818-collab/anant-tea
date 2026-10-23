import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const rows = await db()`SELECT title,slug,content,show_in_footer,is_published,display_order FROM policy_pages WHERE is_published=true ORDER BY display_order,title`;
    return NextResponse.json({ pages: rows.map((r) => ({ title: String(r.title), slug: String(r.slug), content: String(r.content ?? ""), showInFooter: Boolean(r.show_in_footer), displayOrder: Number(r.display_order ?? 0) })) });
  } catch { return NextResponse.json({ pages: [] }); }
}
