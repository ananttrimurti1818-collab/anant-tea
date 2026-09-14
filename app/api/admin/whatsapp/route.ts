import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const statuses = ["New", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const normalize = (value: string) => value.replace(/\\n/g, "\n");

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, status, template, is_active, updated_at
      FROM whatsapp_templates
      WHERE status = ANY(${statuses})
      ORDER BY array_position(${statuses}, status)
    `;
    const templates: Record<string, string> = {};
    for (const row of rows) templates[String(row.status)] = normalize(String(row.template));
    return NextResponse.json({ statuses, templates });
  } catch (error) {
    console.error("GET /api/admin/whatsapp", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load WhatsApp templates." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json() as { status?: string; template?: string; isActive?: boolean };
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const template = typeof body.template === "string" ? body.template : "";
    if (!statuses.includes(status) || !template.trim()) {
      return NextResponse.json({ error: "Valid status and template are required." }, { status: 400 });
    }
    const sql = db();
    const rows = await sql`
      UPDATE whatsapp_templates
      SET template = ${template}, is_active = ${body.isActive !== false}, updated_at = CURRENT_TIMESTAMP
      WHERE status = ${status}
      RETURNING id, status, template, is_active, updated_at
    `;
    if (!rows[0]) return NextResponse.json({ error: "Template not found." }, { status: 404 });
    return NextResponse.json({ success: true, template: normalize(String(rows[0].template)) });
  } catch (error) {
    console.error("PATCH /api/admin/whatsapp", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save WhatsApp template." }, { status: 500 });
  }
}
