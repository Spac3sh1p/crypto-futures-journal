import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const AUTH_COOKIE = "cfj_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Minimal single-user authentication for a local-first app.
 * Uses APP_PASSWORD + AUTH_SECRET env vars.
 * If either is missing in production, all protected routes fail closed.
 */

function getAuthSecret(): string | null {
  return process.env.AUTH_SECRET || null;
}

function getAppPassword(): string | null {
  return process.env.APP_PASSWORD || null;
}

/** Hash the password with the auth secret to produce a session token */
function makeSessionToken(password: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

/** Verify if auth is configured. If not configured, allow access in dev mode only. */
export function isAuthConfigured(): boolean {
  return !!(getAuthSecret() && getAppPassword());
}

/**
 * Validate a login attempt. Returns a session token on success, null on failure.
 */
export function validateLogin(password: string): string | null {
  const secret = getAuthSecret();
  const appPassword = getAppPassword();

  if (!secret || !appPassword) return null;
  if (password !== appPassword) return null;

  return makeSessionToken(appPassword, secret);
}

/**
 * Check if the current request is authenticated.
 * In development with no auth configured, returns true (open access).
 * In production or when auth is configured, verifies the session cookie.
 */
export async function isAuthenticated(): Promise<boolean> {
  const secret = getAuthSecret();
  const appPassword = getAppPassword();

  // If auth is not configured, allow in dev only
  if (!secret || !appPassword) {
    if (process.env.NODE_ENV === "production") return false; // fail closed
    return true; // dev mode, no auth configured = open access
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE);
  if (!sessionCookie) return false;

  const expectedToken = makeSessionToken(appPassword, secret);
  return crypto.timingSafeEqual(
    Buffer.from(sessionCookie.value),
    Buffer.from(expectedToken)
  );
}

/**
 * Guard for API routes. Returns a 401 response if not authenticated, or null if OK.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}

/** Cookie options for the session token */
export function getSessionCookieOptions() {
  return {
    name: AUTH_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}
