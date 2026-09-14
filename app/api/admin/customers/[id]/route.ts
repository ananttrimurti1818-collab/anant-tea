import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const sql = db();

    const rows = await sql`
      SELECT id, name, phone, email, address, city, state, pincode,
             "totalOrders", "totalSpent", "createdAt", "updatedAt"
      FROM "Customer"
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const c = rows[0];
    const orders = await sql`
      SELECT id, "orderNumber", subtotal, shipping, discount, total,
             "paymentMethod", "paymentStatus", "orderStatus", "createdAt"
      FROM "Order"
      WHERE "customerId" = ${id}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({
      customer: {
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
        orders: orders.map((o: any) => ({
          id: String(o.id),
          orderNumber: String(o.orderNumber),
          subtotal: Number(o.subtotal),
          shipping: Number(o.shipping),
          discount: Number(o.discount),
          total: Number(o.total),
          paymentMethod: String(o.paymentMethod),
          paymentStatus: String(o.paymentStatus),
          status: String(o.orderStatus),
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/customers/[id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load customer profile." },
      { status: 500 }
    );
  }
}
