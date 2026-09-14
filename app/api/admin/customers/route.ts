import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    const customers = q
      ? await sql`
          SELECT
            c.id, c.name, c.phone, c.email, c.address, c.city, c.state, c.pincode,
            c."totalOrders", c."totalSpent", c."createdAt", c."updatedAt"
          FROM "Customer" c
          WHERE c.name ILIKE ${"%" + q + "%"}
             OR c.phone ILIKE ${"%" + q + "%"}
             OR regexp_replace(c.phone, '\\D', '', 'g') ILIKE ${"%" + q.replace(/\D/g, "") + "%"}
             OR COALESCE(c.email, '') ILIKE ${"%" + q + "%"}
          ORDER BY c."updatedAt" DESC
        `
      : await sql`
          SELECT
            c.id, c.name, c.phone, c.email, c.address, c.city, c.state, c.pincode,
            c."totalOrders", c."totalSpent", c."createdAt", c."updatedAt"
          FROM "Customer" c
          ORDER BY c."updatedAt" DESC
        `;

    return NextResponse.json({
      customers: customers.map((c: any) => ({
        id: String(c.id),
        name: String(c.name),
        phone: String(c.phone),
        email: c.email ? String(c.email) : "",
        address: String(c.address ?? ""),
        city: String(c.city ?? ""),
        state: String(c.state ?? ""),
        pincode: String(c.pincode ?? ""),
        totalOrders: Number(c.totalOrders ?? 0),
        totalSpent: Number(c.totalSpent ?? 0),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/customers", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load customers." },
      { status: 500 }
    );
  }
}
