import { NextResponse } from "next/server";
import { validateLogin, getSessionCookieOptions, isAuthConfigured } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // If auth is not configured in dev, return success
    if (!isAuthConfigured() && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ success: true, message: "Auth not configured, access granted" });
    }

    if (!isAuthConfigured()) {
      return NextResponse.json(
        { success: false, message: "Auth not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { password } = body as { password?: string };

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    const token = validateLogin(password);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    const cookieOpts = getSessionCookieOptions();
    const response = NextResponse.json({ success: true, message: "Authenticated" });
    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
