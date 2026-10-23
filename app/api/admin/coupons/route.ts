import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, code, type, value, "minimumOrder", "maximumDiscount", "usageLimit", "usedCount",
             active, "expiresAt", "startsAt", description, priority, title, "visibleOnCheckout"
      FROM "Coupon"
      ORDER BY priority DESC, "createdAt" DESC
    `;

    return NextResponse.json({
      coupons: rows.map((c: any) => ({
        id: String(c.id),
        code: String(c.code),
        type: String(c.type),
        value: num(c.value),
        minimumOrder: num(c.minimumOrder),
        maximumDiscount: c.maximumDiscount == null ? null : num(c.maximumDiscount),
        usageLimit: c.usageLimit == null ? null : num(c.usageLimit),
        usedCount: num(c.usedCount),
        active: Boolean(c.active),
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : "",
        startsAt: c.startsAt ? new Date(c.startsAt).toISOString() : null,
        description: text(c.description),
        priority: num(c.priority),
        title: text(c.title),
        visibleOnCheckout: Boolean(c.visibleOnCheckout),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to load coupons." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return save(req, false);
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return save(req, true);
}

async function save(req: NextRequest, editing: boolean) {
  try {
    const b = await req.json();
    const id = text(b.id);
    const code = text(b.code).toUpperCase();

    if (editing && !id) return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
    if (!code) return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });

    const sql = db();
    const duplicate = await sql`
      SELECT id
      FROM "Coupon"
      WHERE upper(code) = ${code}
      ${editing ? sql`AND id <> ${id}` : sql``}
      LIMIT 1
    `;
    if (duplicate[0]) return NextResponse.json({ error: "Coupon code already exists." }, { status: 409 });

    const values = {
      type: text(b.type) || "PERCENTAGE",
      value: num(b.value),
      minimumOrder: num(b.minimumOrder),
      maximumDiscount: b.maximumDiscount === "" || b.maximumDiscount == null ? null : num(b.maximumDiscount),
      usageLimit: b.usageLimit === "" || b.usageLimit == null ? null : num(b.usageLimit),
      active: b.active !== false,
      expiresAt: b.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      startsAt: b.startsAt || null,
      description: text(b.description) || null,
      priority: num(b.priority),
      title: text(b.title) || null,
      visibleOnCheckout: b.visibleOnCheckout !== false,
    };

    if (editing) {
      await sql`
        UPDATE "Coupon"
        SET code = ${code},
            type = ${values.type},
            value = ${values.value},
            "minimumOrder" = ${values.minimumOrder},
            "maximumDiscount" = ${values.maximumDiscount},
            "usageLimit" = ${values.usageLimit},
            active = ${values.active},
            "expiresAt" = ${values.expiresAt},
            "startsAt" = ${values.startsAt},
            description = ${values.description},
            priority = ${values.priority},
            title = ${values.title},
            "visibleOnCheckout" = ${values.visibleOnCheckout},
            "welcomeCoupon" = false,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO "Coupon" (
          id, code, type, value, "minimumOrder", "maximumDiscount", "usageLimit", "usedCount",
          active, "expiresAt", "startsAt", description, priority, title, "visibleOnCheckout", "welcomeCoupon",
          "createdAt", "updatedAt"
        ) VALUES (
          ${crypto.randomUUID()}, ${code}, ${values.type}, ${values.value}, ${values.minimumOrder}, ${values.maximumDiscount},
          ${values.usageLimit}, 0, ${values.active}, ${values.expiresAt}, ${values.startsAt}, ${values.description},
          ${values.priority}, ${values.title}, ${values.visibleOnCheckout}, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to save coupon." }, { status: 500 });
  }
}
