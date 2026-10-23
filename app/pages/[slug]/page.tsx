import { notFound } from "next/navigation";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function CustomPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let rows: Record<string, unknown>[];
  try { rows = await db()`SELECT title,content FROM policy_pages WHERE slug=${slug} AND is_published=true LIMIT 1` as Record<string, unknown>[]; }
  catch { notFound(); }
  if (!rows![0]) notFound();
  const page = rows![0];
  return <main className="section" style={{ maxWidth: 900, margin: "0 auto", padding: "60px 22px 90px", minHeight: "55vh" }}><div className="eyebrow">Anant Tea · Information</div><h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "12px 0 28px" }}>{String(page.title)}</h1><article style={{ whiteSpace: "pre-wrap", lineHeight: 1.85, color: "var(--muted, #53645a)", overflowWrap: "anywhere" }}>{String(page.content ?? "")}</article></main>;
}
