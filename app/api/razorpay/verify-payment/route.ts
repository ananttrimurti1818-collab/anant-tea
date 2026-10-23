import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = text(body.orderId);
    const razorpayOrderId = text(body.razorpay_order_id);
    const razorpayPaymentId = text(body.razorpay_payment_id);
    const razorpaySignature = text(body.razorpay_signature);
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Required payment verification fields are missing." }, { status: 400 });
    }
    if (!secret) {
      return NextResponse.json({ error: "Razorpay is not configured on the server." }, { status: 503 });
    }

    const expected = createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return NextResponse.json({ error: "Payment signature verification failed. The order has not been marked paid." }, { status: 400 });
    }

    const sql = db();
    const orders = await sql`
      SELECT id, "orderNumber", total, "paymentStatus", "razorpayOrderId"
      FROM "Order"
      WHERE id = ${orderId}
      LIMIT 1
    `;
    const order = orders[0];
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (String(order.razorpayOrderId || "") !== razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order does not match this store order." }, { status: 400 });
    }

    if (String(order.paymentStatus).toUpperCase() !== "PAID") {
      await sql`
        UPDATE "Order"
        SET "paymentStatus" = 'PAID',
            "paymentMethod" = 'ONLINE',
            "paymentGateway" = 'RAZORPAY',
            "razorpayPaymentId" = ${razorpayPaymentId},
            "paymentReference" = ${razorpayPaymentId},
            "paidAt" = CURRENT_TIMESTAMP,
            "verifiedAt" = CURRENT_TIMESTAMP,
            "orderStatus" = 'CONFIRMED',
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${orderId}
          AND "razorpayOrderId" = ${razorpayOrderId}
      `;
    }

    return NextResponse.json({
      success: true,
      order: { id: String(order.id), orderNumber: String(order.orderNumber), total: Number(order.total) },
    });
  } catch (error) {
    console.error("POST /api/razorpay/verify-payment", error);
    return NextResponse.json({ error: "Unable to verify payment. Please contact Anant Tea support before retrying." }, { status: 500 });
  }
}
