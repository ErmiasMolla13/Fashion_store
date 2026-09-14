import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
export const AUTH_COOKIE_NAME = "session";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!JWT_SECRET) {
  console.error("❌ CRITICAL ERROR: JWT_SECRET is undefined in environment variables.");
}

export interface SessionPayload {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

/** Sign a JWT for the given customer. */
export function signAuthToken(payload: SessionPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

/** Verify a JWT and return its payload, or null if invalid/expired. */
export function verifyAuthToken(token: string): SessionPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};

/** Read and verify the current session from the request cookies (server components / route handlers). */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

/** Resolves the current session and confirms it belongs to an admin. Returns
 * null if there is no session or the account isn't an admin — callers should
 * respond 401 (no session) or 403 (logged in, not admin) accordingly. */
export async function getCurrentAdminSession(): Promise<SessionPayload | null> {
  const session = await getCurrentSession();
  if (!session?.isAdmin) return null;
  return session;
}
