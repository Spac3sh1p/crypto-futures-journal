import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  bybitIntervalForKlineInterval,
  buildKlineRequestWindow,
  parseBybitKlines,
  parseBinanceKlines,
} from "@/lib/market/klines";

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const exchange = (searchParams.get("exchange") || "binance").toLowerCase();
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const startTime = Number(searchParams.get("startTime"));
  const endTime = Number(searchParams.get("endTime"));

  if (!["binance", "bybit"].includes(exchange)) {
    return NextResponse.json(
      { success: false, message: "Only Binance and Bybit futures klines are supported" },
      { status: 400 }
    );
  }

  if (!symbol || !Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return NextResponse.json(
      { success: false, message: "symbol, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  const klineWindow = buildKlineRequestWindow(startTime, endTime);
  const url = exchange === "bybit"
    ? new URL("https://api.bybit.com/v5/market/kline")
    : new URL("https://fapi.binance.com/fapi/v1/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set(
    "interval",
    exchange === "bybit"
      ? bybitIntervalForKlineInterval(klineWindow.interval)
      : klineWindow.interval
  );
  if (exchange === "bybit") {
    url.searchParams.set("category", "linear");
    url.searchParams.set("start", String(klineWindow.startTime));
    url.searchParams.set("end", String(klineWindow.endTime));
  } else {
    url.searchParams.set("startTime", String(klineWindow.startTime));
    url.searchParams.set("endTime", String(klineWindow.endTime));
  }
  url.searchParams.set("limit", "1000");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `${exchange} klines request failed: ${response.status}` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const candles = exchange === "bybit"
      ? parseBybitKlines(payload)
      : parseBinanceKlines(payload);
    return NextResponse.json({
      success: true,
      data: {
        candles,
        interval: klineWindow.interval,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown market data error";
    return NextResponse.json(
      { success: false, message: `Failed to fetch ${exchange} klines: ${message}` },
      { status: 502 }
    );
  }
}
