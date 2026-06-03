import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBinanceAccountFlows, fetchBybitTrades, fetchBinanceTrades, fetchHyperliquidTrades } from "@/lib/exchange";
import type { RawAccountFlow, RawTrade } from "@/lib/exchange";
import { requireAuth } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";

// POST /api/exchanges/[id]/sync — trigger trade import
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

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

    // Decrypt the apiSecret for use
    let apiSecret: string;
    try {
      apiSecret = decryptSecret(exchange.apiSecret);
    } catch (decryptError: unknown) {
      const msg = decryptError instanceof Error ? decryptError.message : "Decryption failed";
      return NextResponse.json(
        { success: false, message: `Cannot decrypt credentials: ${msg}` },
        { status: 500 }
      );
    }

    // Determine sync start time: last sync or 90 days ago
    const since: Date = exchange.lastSync
      ? exchange.lastSync
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const existingAccountFlowCount = await prisma.accountFlow.count({
      where: { exchangeId: id },
    });
    const accountFlowSince = existingAccountFlowCount > 0 && exchange.lastSync
      ? exchange.lastSync
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Create SyncLog entry with "running" status
    const syncLog = await prisma.syncLog.create({
      data: {
        exchangeId: id,
        status: "running",
        tradesAdded: 0,
        startedAt: new Date(),
      },
    });

    // Fetch trades from exchange
    let rawTrades: RawTrade[] = [];
    let rawAccountFlows: RawAccountFlow[] = [];
    const credentials = {
      apiKey: exchange.apiKey,
      apiSecret,
      exchange: exchange.name as "bybit" | "binance" | "hyperliquid",
    };

    try {
      if (exchange.name === "bybit") {
        rawTrades = await fetchBybitTrades(credentials, since);
      } else if (exchange.name === "binance") {
        rawTrades = await fetchBinanceTrades(credentials, since);
        rawAccountFlows = await fetchBinanceAccountFlows(credentials, accountFlowSince);
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

    // Batch insert trades, skip duplicates via composite unique (exchangeId + externalId)
    let tradesAdded = 0;
    let tradesUpdated = 0;
    let insertErrors = 0;
    let accountFlowsAdded = 0;
    let accountFlowInsertErrors = 0;

    // Get existing externalIds for this exchange to skip duplicates
    const existingTrades = await prisma.trade.findMany({
      where: { exchangeId: id },
      select: {
        id: true,
        externalId: true,
        fee: true,
        makerFee: true,
        takerFee: true,
      },
    });
    const existingTradesByExternalId = new Map(
      existingTrades.map((trade) => [trade.externalId, trade])
    );

    // Filter to only new trades
    const newTrades = rawTrades.filter((raw) => !existingTradesByExternalId.has(raw.externalId));

    for (const raw of rawTrades) {
      const existingTrade = existingTradesByExternalId.get(raw.externalId);
      if (!existingTrade) continue;
      if (
        existingTrade.fee === raw.fee &&
        existingTrade.makerFee === raw.makerFee &&
        existingTrade.takerFee === raw.takerFee
      ) {
        continue;
      }

      await prisma.trade.update({
        where: { id: existingTrade.id },
        data: {
          fee: raw.fee,
          makerFee: raw.makerFee,
          takerFee: raw.takerFee,
        },
      });
      tradesUpdated++;
    }

    // Insert in batches of 50 within a transaction
    const BATCH_SIZE = 50;
    for (let i = 0; i < newTrades.length; i += BATCH_SIZE) {
      const batch = newTrades.slice(i, i + BATCH_SIZE);
      try {
        await prisma.$transaction(
          batch.map((raw) => {
            const holdDuration = Math.round(
              (raw.exitTime.getTime() - raw.entryTime.getTime()) / 1000
            );
            const pnlPercent =
              raw.entryValue > 0 ? (raw.realizedPnl / raw.entryValue) * 100 : 0;
            const isWin = raw.realizedPnl > 0;

            return prisma.trade.create({
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
          })
        );
        tradesAdded += batch.length;
      } catch (batchError) {
        console.error(`Batch insert failed at offset ${i}:`, batchError);
        insertErrors += batch.length;
      }
    }

    if (rawAccountFlows.length > 0) {
      const existingFlowIds = new Set(
        (await prisma.accountFlow.findMany({
          where: { exchangeId: id },
          select: { externalId: true },
        })).map((flow) => flow.externalId)
      );
      const newAccountFlows = rawAccountFlows.filter((flow) => !existingFlowIds.has(flow.externalId));

      for (let i = 0; i < newAccountFlows.length; i += BATCH_SIZE) {
        const batch = newAccountFlows.slice(i, i + BATCH_SIZE);
        try {
          await prisma.$transaction(
            batch.map((flow) =>
              prisma.accountFlow.create({
                data: {
                  exchangeId: id,
                  externalId: flow.externalId,
                  type: flow.type,
                  asset: flow.asset,
                  amount: flow.amount,
                  symbol: flow.symbol,
                  info: flow.info,
                  time: flow.time,
                },
              })
            )
          );
          accountFlowsAdded += batch.length;
        } catch (batchError) {
          console.error(`Account flow batch insert failed at offset ${i}:`, batchError);
          accountFlowInsertErrors += batch.length;
        }
      }
    }

    // Finalize SyncLog with appropriate status
    const totalInsertErrors = insertErrors + accountFlowInsertErrors;
    const finalStatus = totalInsertErrors > 0
      ? (tradesAdded > 0 || accountFlowsAdded > 0 ? "partial" : "error")
      : "success";
    const flowMessage = exchange.name === "binance"
      ? ` Synced ${accountFlowsAdded} account flows from ${rawAccountFlows.length} fetched.`
      : "";
    const updateMessage = tradesUpdated > 0
      ? ` Updated ${tradesUpdated} existing trade${tradesUpdated === 1 ? "" : "s"} fees.`
      : "";
    const message = totalInsertErrors > 0
      ? `Imported ${tradesAdded} trades, ${insertErrors} failed. Fetched ${rawTrades.length} total. lastSync NOT advanced — retry will re-fetch failed trades.`
      : `Imported ${tradesAdded} new trades from ${rawTrades.length} fetched.${updateMessage}${flowMessage}`;
    const detailedMessage = totalInsertErrors > 0
      ? `Imported ${tradesAdded} trades and ${accountFlowsAdded} account flows; updated ${tradesUpdated} existing trades; ${totalInsertErrors} inserts failed. Fetched ${rawTrades.length} trades and ${rawAccountFlows.length} flows. lastSync NOT advanced - retry will re-fetch failed records.`
      : message;

    // Only advance lastSync on full success to avoid skipping failed trades
    if (finalStatus === "success") {
      await prisma.exchange.update({
        where: { id },
        data: { lastSync: new Date() },
      });
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: finalStatus,
        tradesAdded,
        message: detailedMessage,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tradesAdded,
        tradesUpdated,
        totalFetched: rawTrades.length,
        duplicatesSkipped: rawTrades.length - newTrades.length,
        accountFlowsAdded,
        accountFlowsFetched: rawAccountFlows.length,
        errors: insertErrors,
        accountFlowErrors: accountFlowInsertErrors,
        message: detailedMessage,
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
