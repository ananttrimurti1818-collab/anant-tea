import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const defaults = {
  shippingCharge: 60,
  freeShippingAbove: 499,
  codEnabled: true,
  aboutTitle: "About Anant Tea",
  aboutSubtitle: "A tea brand built around the simple joy of a great cup.",
  aboutStoryHeading: "From Assam leaves to your daily chai.",
  aboutStoryP1: "Anant Tea is focused on delivering quality tea blends with the aroma, colour and strength that Indian tea lovers expect. We believe good tea is not only a product; it is part of conversations, family time and daily rituals.",
  aboutStoryP2: "Our goal is simple: offer dependable, flavourful Assam tea with thoughtful packaging and a modern buying experience.",
  aboutStoryImageUrl: "/about-story-reference.png",
  aboutPromiseHeading: "Better Tea for a Brighter Tomorrow",
  aboutPromiseBody: "We are committed to bringing the richness of Assam tea to more homes, building long-term relationships with our customers, partners and tea-loving communities.",
};
const str = (v: unknown, fallback: string) => typeof v === "string" ? v.trim() : fallback;
const amount = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sql = db();
    const rows = await sql`SELECT * FROM site_settings WHERE id='default' LIMIT 1`;
    const r = rows[0] as Record<string, unknown> | undefined;
    return NextResponse.json({ settings: r ? {
      ...defaults,
      shippingCharge: amount(r.shipping_charge, defaults.shippingCharge),
      freeShippingAbove: amount(r.free_shipping_above, defaults.freeShippingAbove),
      codEnabled: r.cod_enabled === undefined ? true : Boolean(r.cod_enabled),
      aboutTitle: str(r.about_title, defaults.aboutTitle),
      aboutSubtitle: str(r.about_subtitle, defaults.aboutSubtitle),
      aboutStoryHeading: str(r.about_story_heading, defaults.aboutStoryHeading),
      aboutStoryP1: str(r.about_story_p1, defaults.aboutStoryP1),
      aboutStoryP2: str(r.about_story_p2, defaults.aboutStoryP2),
      aboutStoryImageUrl: str(r.about_story_image_url, defaults.aboutStoryImageUrl),
      aboutPromiseHeading: str(r.about_promise_heading, defaults.aboutPromiseHeading),
      aboutPromiseBody: str(r.about_promise_body, defaults.aboutPromiseBody),
    } : defaults });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to load store settings." }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const b = await req.json();
    const sql = db();
    const existingRows = await sql`SELECT * FROM site_settings WHERE id='default' LIMIT 1`;
    const old = existingRows[0] as Record<string, unknown> | undefined;
    const v = {
      shippingCharge: amount(b.shippingCharge, Number(old?.shipping_charge ?? defaults.shippingCharge)),
      freeShippingAbove: amount(b.freeShippingAbove, Number(old?.free_shipping_above ?? defaults.freeShippingAbove)),
      codEnabled: typeof b.codEnabled === "boolean" ? b.codEnabled : (old?.cod_enabled === undefined ? defaults.codEnabled : Boolean(old.cod_enabled)),
      aboutTitle: str(b.aboutTitle, String(old?.about_title ?? defaults.aboutTitle)),
      aboutSubtitle: str(b.aboutSubtitle, String(old?.about_subtitle ?? defaults.aboutSubtitle)),
      aboutStoryHeading: str(b.aboutStoryHeading, String(old?.about_story_heading ?? defaults.aboutStoryHeading)),
      aboutStoryP1: str(b.aboutStoryP1, String(old?.about_story_p1 ?? defaults.aboutStoryP1)),
      aboutStoryP2: str(b.aboutStoryP2, String(old?.about_story_p2 ?? defaults.aboutStoryP2)),
      aboutStoryImageUrl: str(b.aboutStoryImageUrl, String(old?.about_story_image_url ?? defaults.aboutStoryImageUrl)),
      aboutPromiseHeading: str(b.aboutPromiseHeading, String(old?.about_promise_heading ?? defaults.aboutPromiseHeading)),
      aboutPromiseBody: str(b.aboutPromiseBody, String(old?.about_promise_body ?? defaults.aboutPromiseBody)),
    };
    if (!v.aboutTitle || !v.aboutStoryHeading || !v.aboutStoryImageUrl) {
      return NextResponse.json({ error: "About title, story heading, and story image are required." }, { status: 400 });
    }
    await sql`INSERT INTO site_settings (
      id, shipping_charge, free_shipping_above, cod_enabled, about_title, about_subtitle,
      about_story_heading, about_story_p1, about_story_p2, about_story_image_url,
      about_promise_heading, about_promise_body, updated_at
    ) VALUES (
      'default', ${v.shippingCharge}, ${v.freeShippingAbove}, ${v.codEnabled}, ${v.aboutTitle}, ${v.aboutSubtitle},
      ${v.aboutStoryHeading}, ${v.aboutStoryP1}, ${v.aboutStoryP2}, ${v.aboutStoryImageUrl},
      ${v.aboutPromiseHeading}, ${v.aboutPromiseBody}, CURRENT_TIMESTAMP
    ) ON CONFLICT (id) DO UPDATE SET
      shipping_charge=EXCLUDED.shipping_charge, free_shipping_above=EXCLUDED.free_shipping_above, cod_enabled=EXCLUDED.cod_enabled,
      about_title=EXCLUDED.about_title, about_subtitle=EXCLUDED.about_subtitle,
      about_story_heading=EXCLUDED.about_story_heading, about_story_p1=EXCLUDED.about_story_p1,
      about_story_p2=EXCLUDED.about_story_p2, about_story_image_url=EXCLUDED.about_story_image_url,
      about_promise_heading=EXCLUDED.about_promise_heading, about_promise_body=EXCLUDED.about_promise_body,
      updated_at=CURRENT_TIMESTAMP`;
    return NextResponse.json({ success: true, settings: v });
  } catch (e) {
    console.error("PATCH /api/admin/store-settings", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to save settings. Run the database migration first." }, { status: 500 });
  }
}
