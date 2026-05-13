import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

// GET /api/exchanges — list all exchanges (hide apiSecret)
export async function GET() {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    const exchanges = await prisma.exchange.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        apiKey: true,
        label: true,
        isActive: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { trades: true } },
      },
    });

    // Mask API keys: show only last 4 chars
    const masked = exchanges.map((ex) => ({
      ...ex,
      apiKey: "***" + ex.apiKey.slice(-4),
    }));

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    console.error("GET /api/exchanges error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}

// POST /api/exchanges — add new exchange (validate connection first)
export async function POST(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { name, apiKey, apiSecret, label } = body as {
      name: string;
      apiKey: string;
      apiSecret: string;
      label?: string;
    };

    // Validate required fields
    if (!name || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: "name, apiKey, and apiSecret are required" },
        { status: 400 }
      );
    }

    if (!["bybit", "binance", "hyperliquid"].includes(name)) {
      return NextResponse.json(
        { success: false, message: "Supported exchanges: bybit, binance, hyperliquid" },
        { status: 400 }
      );
    }

    // Validate label length
    if (label && (typeof label !== "string" || label.length > 100)) {
      return NextResponse.json(
        { success: false, message: "Label must be a string with max 100 characters" },
        { status: 400 }
      );
    }

    // Validate apiKey/apiSecret are strings and not excessively long
    if (typeof apiKey !== "string" || apiKey.length > 500) {
      return NextResponse.json(
        { success: false, message: "Invalid API key format" },
        { status: 400 }
      );
    }
    if (typeof apiSecret !== "string" || apiSecret.length > 500) {
      return NextResponse.json(
        { success: false, message: "Invalid API secret format" },
        { status: 400 }
      );
    }

    // Test connection by importing ccxt and attempting to fetch balance
    try {
      const ccxt = await import("ccxt");
      const exchangeOptions: Record<string, { defaultType: string }> = {
        bybit: { defaultType: "swap" },
        binance: { defaultType: "future" },
        hyperliquid: { defaultType: "swap" },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ExchangeClass = (ccxt as any)[name];
      const exchange = new ExchangeClass({
        apiKey,
        secret: apiSecret,
        options: exchangeOptions[name],
      });

      // Test: fetch balance to verify credentials
      await exchange.fetchBalance();
    } catch (connError: unknown) {
      const msg = connError instanceof Error ? connError.message : "Unknown connection error";
      return NextResponse.json(
        { success: false, message: `Connection failed: ${msg}` },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.exchange.findFirst({
      where: { name, apiKey },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "This exchange with the same API key already exists" },
        { status: 409 }
      );
    }

    // Encrypt apiSecret before saving
    const encryptedSecret = encryptSecret(apiSecret);

    // Save to database
    const created = await prisma.exchange.create({
      data: {
        name,
        apiKey,
        apiSecret: encryptedSecret,
        label: label || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          name: created.name,
          apiKey: "***" + created.apiKey.slice(-4),
          label: created.label,
          isActive: created.isActive,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/exchanges error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add exchange" },
      { status: 500 }
    );
  }
}
