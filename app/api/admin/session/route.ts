import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Firebase ID token is required." }, { status: 400 });
    }

    const { sessionCookie, email } = await createAdminSession(idToken);
    const response = NextResponse.json({ success: true, email });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("POST /api/admin/session", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create admin session." },
      { status: 401 }
    );
  }
}
