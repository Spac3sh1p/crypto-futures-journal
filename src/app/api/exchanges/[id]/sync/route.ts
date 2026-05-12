import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBybitTrades, fetchBinanceTrades, fetchHyperliquidTrades } from "@/lib/exchange";
import type { RawTrade } from "@/lib/exchange";

// POST /api/exchanges/[id]/sync — trigger trade import
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json(
        { success: false, message: "Exchange not found" },
        { status: 404 }
      );
    }

    if (!exchange.isActive) {
      return NextResponse.json(
        { success: false, message: "Exchange is disabled" },
        { status: 400 }
      );
    }

    // Determine sync start time: last sync or 90 days ago
    const since: Date = exchange.lastSync
      ? exchange.lastSync
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Create SyncLog entry
    const syncLog = await prisma.syncLog.create({
      data: {
        exchangeId: id,
        status: "success",
        tradesAdded: 0,
        startedAt: new Date(),
      },
    });

    // Fetch trades from exchange
    let rawTrades: RawTrade[] = [];
    const credentials = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
      exchange: exchange.name as "bybit" | "binance",
    };

    try {
      if (exchange.name === "bybit") {
        rawTrades = await fetchBybitTrades(credentials, since);
      } else if (exchange.name === "binance") {
        rawTrades = await fetchBinanceTrades(credentials, since);
      } else if (exchange.name === "hyperliquid") {
        rawTrades = await fetchHyperliquidTrades(credentials, since);
      }
    } catch (fetchError: unknown) {
      const msg = fetchError instanceof Error ? fetchError.message : "Fetch failed";
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "error", message: msg, completedAt: new Date() },
      });
      return NextResponse.json(
        { success: false, message: `Sync failed: ${msg}` },
        { status: 500 }
      );
    }

    // Insert trades, skip duplicates by externalId
    let tradesAdded = 0;
    for (const raw of rawTrades) {
      const existing = await prisma.trade.findFirst({
        where: { externalId: raw.externalId },
      });
      if (existing) continue;

      // Calculate derived fields
      const holdDuration = Math.round(
        (raw.exitTime.getTime() - raw.entryTime.getTime()) / 1000
      );
      const pnlPercent =
        raw.entryValue > 0 ? (raw.realizedPnl / raw.entryValue) * 100 : 0;
      const isWin = raw.realizedPnl > 0;

      await prisma.trade.create({
        data: {
          exchangeId: id,
          externalId: raw.externalId,
          symbol: raw.symbol,
          baseCoin: raw.baseCoin,
          quoteCoin: raw.quoteCoin,
          side: raw.side,
          leverage: raw.leverage,
          marginMode: raw.marginMode,
          entryPrice: raw.entryPrice,
          entryQty: raw.entryQty,
          entryValue: raw.entryValue,
          entryTime: raw.entryTime,
          exitPrice: raw.exitPrice,
          exitQty: raw.exitQty,
          exitValue: raw.exitValue,
          exitTime: raw.exitTime,
          realizedPnl: raw.realizedPnl,
          fee: raw.fee,
          makerFee: raw.makerFee,
          takerFee: raw.takerFee,
          fundingFee: raw.fundingFee,
          pnlPercent,
          holdDuration,
          isWin,
        },
      });
      tradesAdded++;
    }

    // Update exchange lastSync
    await prisma.exchange.update({
      where: { id },
      data: { lastSync: new Date() },
    });

    // Finalize SyncLog
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "success",
        tradesAdded,
        message: `Imported ${tradesAdded} new trades from ${rawTrades.length} fetched`,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tradesAdded,
        totalFetched: rawTrades.length,
        message: `Imported ${tradesAdded} new trades`,
      },
    });
  } catch (error) {
    console.error("POST /api/exchanges/[id]/sync error:", error);
    return NextResponse.json(
      { success: false, message: "Sync failed unexpectedly" },
      { status: 500 }
    );
  }
}
