import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const sql = db();
    const [summary, monthly, daily] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE "orderStatus" <> 'CANCELLED')::int AS total_orders,
          COUNT(*) FILTER (WHERE "orderStatus" = 'DELIVERED')::int AS delivered_orders,
          COUNT(*) FILTER (WHERE "orderStatus" = 'CANCELLED')::int AS cancelled_orders,
          COUNT(DISTINCT "customerId")::int AS customers,
          COUNT(DISTINCT "customerId") FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS new_customers,
          COALESCE(SUM(subtotal) FILTER (WHERE "orderStatus" <> 'CANCELLED'), 0) AS gross_sales,
          COALESCE(SUM(discount) FILTER (WHERE "orderStatus" <> 'CANCELLED'), 0) AS discounts,
          COALESCE(SUM(subtotal - discount) FILTER (WHERE "orderStatus" <> 'CANCELLED'), 0) AS net_sales,
          COALESCE(SUM(subtotal - discount) FILTER (WHERE "orderStatus" <> 'CANCELLED' AND "createdAt" >= CURRENT_DATE), 0) AS today_sales
        FROM "Order"
      `,
      sql`
        SELECT COALESCE(SUM(subtotal - discount), 0) AS value
        FROM "Order"
        WHERE "orderStatus" <> 'CANCELLED'
          AND "createdAt" >= date_trunc('month', CURRENT_DATE)
      `,
      sql`
        SELECT
          to_char(date_trunc('day', "createdAt"), 'DD Mon') AS day_label,
          COALESCE(SUM(subtotal - discount) FILTER (WHERE "orderStatus" <> 'CANCELLED'), 0) AS value,
          COUNT(*) FILTER (WHERE "orderStatus" <> 'CANCELLED')::int AS orders
        FROM "Order"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date_trunc('day', "createdAt")
      `,
    ]);

    const s = summary[0];
    return NextResponse.json({
      summary: {
        totalOrders: Number(s.total_orders),
        deliveredOrders: Number(s.delivered_orders),
        cancelledOrders: Number(s.cancelled_orders),
        customers: Number(s.customers),
        newCustomers: Number(s.new_customers),
        grossSales: Number(s.gross_sales),
        discounts: Number(s.discounts),
        netSales: Number(s.net_sales),
        monthSales: Number(monthly[0]?.value ?? 0),
        todaySales: Number(s.today_sales),
      },
      daily: daily.map((x) => ({ day: String(x.day_label), value: Number(x.value), orders: Number(x.orders) })),
    });
  } catch (error) {
    console.error("GET /api/admin/reports failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load sales reports." }, { status: 500 });
  }
}
