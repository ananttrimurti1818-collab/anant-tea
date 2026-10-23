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

    const orders = await sql`
      SELECT
        o.id,
        o."orderNumber",
        o."customerId",
        o.subtotal,
        o.shipping,
        o.discount,
        o.total,
        o."paymentMethod",
        o."paymentStatus",
        o."orderStatus",
        o."createdAt",
        o."updatedAt",
        o.address,
        o.city,
        o.state,
        o.pincode,
        o."couponCode",
        o."paymentProof",
        o."paymentReference",
        o."verifiedAt",
        o."paidAt",
        o."paymentSubmittedAt",
        o."cashfreeOrderId",
        o."cashfreePaymentId",
        o."paymentGateway",
        o."cashfreePaymentSessionId",
        o."trackingNumber",
        o."courierName",
        o.notes,
        o."shippedAt",
        o."deliveredAt",
        o."cancelledAt",
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email
      FROM "Order" o
      LEFT JOIN "Customer" c ON c.id = o."customerId"
      WHERE o.id = ${id}
      LIMIT 1
    `;

    if (!orders[0]) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const o = orders[0];
    const items = await sql`
      SELECT
        id,
        "productId",
        "variantId",
        quantity,
        price,
        "productName",
        "variantPackSize"
      FROM "OrderItem"
      WHERE "orderId" = ${String(o.id)}
      ORDER BY "createdAt"
    `;

    const history = await sql`
      SELECT id, old_status, new_status, changed_by, created_at
      FROM legacy_order_status_history
      WHERE order_id = ${String(o.id)}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      order: {
        id: String(o.id),
        orderNumber: String(o.orderNumber),
        customerId: o.customerId ? String(o.customerId) : "",
        customerName: String(o.customer_name ?? ""),
        customerPhone: String(o.customer_phone ?? ""),
        customerEmail: String(o.customer_email ?? ""),
        subtotal: Number(o.subtotal),
        shipping: Number(o.shipping),
        discount: Number(o.discount),
        total: Number(o.total),
        paymentMethod: String(o.paymentMethod),
        paymentStatus: String(o.paymentStatus),
        orderStatus: String(o.orderStatus),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        address: String(o.address ?? ""),
        city: String(o.city ?? ""),
        state: String(o.state ?? ""),
        pincode: String(o.pincode ?? ""),
        couponCode: o.couponCode ? String(o.couponCode) : "",
        paymentProof: o.paymentProof ? String(o.paymentProof) : "",
        paymentReference: o.paymentReference ? String(o.paymentReference) : "",
        verifiedAt: o.verifiedAt,
        paidAt: o.paidAt,
        paymentSubmittedAt: o.paymentSubmittedAt,
        cashfreeOrderId: o.cashfreeOrderId ? String(o.cashfreeOrderId) : "",
        cashfreePaymentId: o.cashfreePaymentId ? String(o.cashfreePaymentId) : "",
        paymentGateway: o.paymentGateway ? String(o.paymentGateway) : "",
        cashfreePaymentSessionId: o.cashfreePaymentSessionId ? String(o.cashfreePaymentSessionId) : "",
        trackingNumber: o.trackingNumber ? String(o.trackingNumber) : "",
        courierName: o.courierName ? String(o.courierName) : "",
        notes: o.notes ? String(o.notes) : "",
        shippedAt: o.shippedAt,
        deliveredAt: o.deliveredAt,
        cancelledAt: o.cancelledAt,
        items: items.map((i: any) => ({
          id: String(i.id),
          productId: i.productId ? String(i.productId) : "",
          variantId: i.variantId ? String(i.variantId) : "",
          quantity: Number(i.quantity),
          price: Number(i.price),
          productName: String(i.productName),
          packSize: String(i.variantPackSize),
          lineTotal: Number(i.price) * Number(i.quantity),
        })),
        history: history.map((h: any) => ({
          id: String(h.id),
          oldStatus: h.old_status ? String(h.old_status) : "",
          newStatus: String(h.new_status),
          changedBy: h.changed_by ? String(h.changed_by) : "",
          createdAt: h.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders/[id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load order details." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const sql = db();
    const rows = await sql`
      SELECT id, "customerId", total, "couponCode"
      FROM "Order"
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const order = rows[0];

    await sql.begin(async (tx) => {
      await tx`DELETE FROM legacy_order_status_history WHERE order_id = ${id}`;
      await tx`DELETE FROM "OrderItem" WHERE "orderId" = ${id}`;
      await tx`DELETE FROM "Order" WHERE id = ${id}`;

      if (order.customerId) {
        await tx`
          UPDATE "Customer"
          SET "totalOrders" = GREATEST(0, COALESCE("totalOrders", 0) - 1),
              "totalSpent" = GREATEST(0, COALESCE("totalSpent", 0) - ${Number(order.total ?? 0)}),
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${String(order.customerId)}
        `;
      }

      if (order.couponCode) {
        await tx`
          UPDATE "Coupon"
          SET "usedCount" = GREATEST(0, COALESCE("usedCount", 0) - 1),
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE upper(code) = upper(${String(order.couponCode)})
        `;
      }
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/admin/orders/[id] failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete order." }, { status: 500 });
  }
}
