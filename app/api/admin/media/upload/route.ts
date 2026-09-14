import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sign(params: Record<string, string>, secret: string) {
  const body = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(body + secret).digest("hex");
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !apiKey || !secret) {
      return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "anant-tea").replace(/[^a-zA-Z0-9/_-]/g, "");
    if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Maximum image size is 10 MB." }, { status: 400 });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign({ folder, timestamp }, secret);
    const upload = new FormData();
    upload.append("file", new Blob([await file.arrayBuffer()], { type: file.type }), file.name);
    upload.append("api_key", apiKey);
    upload.append("timestamp", timestamp);
    upload.append("folder", folder);
    upload.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: upload });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Cloudinary upload failed." }, { status: 502 });

    return NextResponse.json({ url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height });
  } catch (error) {
    console.error("POST /api/admin/media/upload", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 500 });
  }
}
