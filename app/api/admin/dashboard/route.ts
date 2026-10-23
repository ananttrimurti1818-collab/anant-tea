import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();
    const [sales, orders, customers, recent] = await Promise.all([
      sql`
        SELECT
          COALESCE(SUM(subtotal - discount) FILTER (WHERE "orderStatus" <> 'CANCELLED'), 0) AS total_sales,
          COALESCE(SUM(subtotal - discount) FILTER (WHERE "orderStatus" <> 'CANCELLED' AND "createdAt" >= CURRENT_DATE), 0) AS today_sales,
          COUNT(*) FILTER (WHERE "orderStatus" <> 'CANCELLED') AS total_orders
        FROM "Order"
      `,
      sql`SELECT COUNT(*) AS count FROM "Order"`,
      sql`SELECT COUNT(*) AS count FROM "Customer"`,
      sql`
        SELECT o.id, o."orderNumber", o.total, o."orderStatus", o."createdAt",
               c.name AS customer_name
        FROM "Order" o
        LEFT JOIN "Customer" c ON c.id = o."customerId"
        ORDER BY o."createdAt" DESC
        LIMIT 8
      `,
    ]);

    const week = await sql`
      SELECT COALESCE(SUM(subtotal - discount), 0) AS value
      FROM "Order"
      WHERE "orderStatus" <> 'CANCELLED'
        AND "createdAt" >= CURRENT_DATE - INTERVAL '6 days'
    `;

    return NextResponse.json({
      stats: {
        totalSales: Number(sales[0]?.total_sales ?? 0),
        todaySales: Number(sales[0]?.today_sales ?? 0),
        totalOrders: Number(orders[0]?.count ?? 0),
        customers: Number(customers[0]?.count ?? 0),
        weekSales: Number(week[0]?.value ?? 0),
      },
      recentOrders: recent.map((o: any) => ({
        id: String(o.id),
        orderNumber: String(o.orderNumber),
        customerName: String(o.customer_name ?? "Guest"),
        total: Number(o.total),
        status: String(o.orderStatus),
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dashboard." },
      { status: 500 }
    );
  }
}
