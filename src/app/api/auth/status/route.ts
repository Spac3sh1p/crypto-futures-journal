import { NextResponse } from "next/server";
import { isAuthenticated, isAuthConfigured } from "@/lib/auth";

export async function GET() {
  try {
    const configured = isAuthConfigured();
    const authed = await isAuthenticated();

    return NextResponse.json({
      success: true,
      data: {
        authRequired: configured,
        authenticated: authed,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/status error:", error);
    return NextResponse.json(
      { success: false, message: "Auth check failed" },
      { status: 500 }
    );
  }
}
