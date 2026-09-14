import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, code, type, value, "minimumOrder", "maximumDiscount", description, title, "startsAt", "expiresAt"
      FROM "Coupon"
      WHERE active = true
        AND "visibleOnCheckout" = true
        AND ("startsAt" IS NULL OR "startsAt" <= CURRENT_TIMESTAMP)
        AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
        AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
      ORDER BY priority DESC, "createdAt" DESC
    `;

    return NextResponse.json({
      coupons: rows.map((c: any) => ({
        id: String(c.id),
        code: String(c.code),
        type: String(c.type),
        value: Number(c.value),
        minimumOrder: Number(c.minimumOrder || 0),
        maximumDiscount: c.maximumDiscount == null ? null : Number(c.maximumDiscount),
        description: String(c.description || ""),
        title: String(c.title || ""),
        startsAt: c.startsAt ? new Date(c.startsAt).toISOString() : null,
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to load coupons." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
    const amount = Number(subtotal);

    if (!normalized || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "Coupon code and order subtotal are required." }, { status: 400 });
    }

    const sql = db();
    const rows = await sql`
      SELECT id, code, type, value, "minimumOrder", "maximumDiscount", "usageLimit", "usedCount", active, "startsAt", "expiresAt", "visibleOnCheckout"
      FROM "Coupon"
      WHERE upper(code) = ${normalized}
      LIMIT 1
    `;
    const c = rows[0];

    if (!c || !c.active) {
      return NextResponse.json({ error: "Coupon is invalid or inactive." }, { status: 400 });
    }
    if (!c.visibleOnCheckout) {
      return NextResponse.json({ error: "This coupon is not available at checkout." }, { status: 400 });
    }
    if (c.startsAt && new Date(c.startsAt) > new Date()) {
      return NextResponse.json({ error: "Coupon has not started yet." }, { status: 400 });
    }
    if (c.expiresAt && new Date(c.expiresAt) <= new Date()) {
      return NextResponse.json({ error: "Coupon has expired." }, { status: 400 });
    }
    if (c.usageLimit !== null && Number(c.usedCount) >= Number(c.usageLimit)) {
      return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 400 });
    }
    if (amount < Number(c.minimumOrder || 0)) {
      return NextResponse.json({ error: `Minimum order value is ₹${Number(c.minimumOrder).toLocaleString("en-IN")}.` }, { status: 400 });
    }

    let discount = String(c.type).toUpperCase().includes("PERCENT")
      ? amount * Number(c.value) / 100
      : Number(c.value);
    if (c.maximumDiscount !== null) discount = Math.min(discount, Number(c.maximumDiscount));
    discount = Math.max(0, Math.min(discount, amount));

    return NextResponse.json({
      valid: true,
      code: String(c.code),
      discount: Math.round(discount),
      type: String(c.type),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to validate coupon." }, { status: 500 });
  }
}
