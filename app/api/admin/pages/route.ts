import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const slugify = (value: unknown) => String(value ?? "").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
const shape = (r: Record<string, unknown>) => ({ id: String(r.id), title: String(r.title), slug: String(r.slug), content: String(r.content ?? ""), showInFooter: Boolean(r.show_in_footer), isPublished: Boolean(r.is_published), displayOrder: Number(r.display_order ?? 0) });
export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  try { const rows = await db()`SELECT * FROM policy_pages ORDER BY display_order, title`; return NextResponse.json({ pages: rows.map((r) => shape(r as Record<string, unknown>)) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to load pages. Run database migrations." }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const b = await req.json(); const title = String(b.title ?? "").trim(); const slug = slugify(b.slug || title); const content = String(b.content ?? "").trim();
    if (!title || !slug || !content) return NextResponse.json({ error: "Title, URL slug and page content are required." }, { status: 400 });
    const rows = await db()`INSERT INTO policy_pages(title,slug,content,show_in_footer,is_published,display_order,updated_at) VALUES(${title},${slug},${content},${b.showInFooter !== false},${b.isPublished !== false},${Number.isFinite(Number(b.displayOrder)) ? Math.trunc(Number(b.displayOrder)) : 0},CURRENT_TIMESTAMP) RETURNING *`;
    return NextResponse.json({ page: shape(rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (e) { const message = e instanceof Error ? e.message : "Unable to create page."; return NextResponse.json({ error: message.includes("unique") ? "That page URL already exists. Choose a different slug." : message }, { status: 500 }); }
}
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const b = await req.json(); const id = String(b.id ?? ""); const title = String(b.title ?? "").trim(); const slug = slugify(b.slug || title); const content = String(b.content ?? "").trim();
    if (!id || !title || !slug || !content) return NextResponse.json({ error: "Page ID, title, URL slug and content are required." }, { status: 400 });
    const rows = await db()`UPDATE policy_pages SET title=${title},slug=${slug},content=${content},show_in_footer=${b.showInFooter !== false},is_published=${b.isPublished !== false},display_order=${Number.isFinite(Number(b.displayOrder)) ? Math.trunc(Number(b.displayOrder)) : 0},updated_at=CURRENT_TIMESTAMP WHERE id=${id} RETURNING *`;
    if (!rows[0]) return NextResponse.json({ error: "Page not found." }, { status: 404 });
    return NextResponse.json({ page: shape(rows[0] as Record<string, unknown>) });
  } catch (e) { const message = e instanceof Error ? e.message : "Unable to update page."; return NextResponse.json({ error: message.includes("unique") ? "That page URL already exists. Choose a different slug." : message }, { status: 500 }); }
}
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try { const id = req.nextUrl.searchParams.get("id"); if (!id) return NextResponse.json({ error: "Page ID is required." }, { status: 400 }); await db()`DELETE FROM policy_pages WHERE id=${id}`; return NextResponse.json({ success: true }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to delete page." }, { status: 500 }); }
}
