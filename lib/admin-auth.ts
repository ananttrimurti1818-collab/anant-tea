import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const COOKIE_NAME = "anant_admin_session";
const SESSION_DAYS = 5;

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export async function isAllowedAdmin(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length && configured.includes(normalized)) return true;

  try {
    const sql = db();
    const rows = await sql`SELECT email FROM "Admin" WHERE email IS NOT NULL`;
    return rows.some((row: { email?: string }) => String(row.email || "").trim().toLowerCase() === normalized);
  } catch {
    return false;
  }
}

export async function verifyIdToken(idToken: string) {
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (!(await isAllowedAdmin(decoded.email))) {
    throw new Error("This account is not authorized to access the Anant Tea admin panel.");
  }
  return decoded;
}

export async function createAdminSession(idToken: string) {
  const decoded = await verifyIdToken(idToken);
  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  return { sessionCookie, email: decoded.email || "" };
}

export async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME)?.value;
    if (!session) {
      return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
    }

    const decoded = await adminAuth().verifySessionCookie(session, true);
    if (!(await isAllowedAdmin(decoded.email))) {
      return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: "Admin session is invalid or expired." }, { status: 401 });
  }
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
