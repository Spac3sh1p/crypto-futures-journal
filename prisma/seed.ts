import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter } as any);

const SYMBOLS = [
  { symbol: "BTCUSDT", baseCoin: "BTC" },
  { symbol: "ETHUSDT", baseCoin: "ETH" },
  { symbol: "SOLUSDT", baseCoin: "SOL" },
  { symbol: "DOGEUSDT", baseCoin: "DOGE" },
  { symbol: "ARBUSDT", baseCoin: "ARB" },
  { symbol: "AVAXUSDT", baseCoin: "AVAX" },
  { symbol: "LINKUSDT", baseCoin: "LINK" },
  { symbol: "XRPUSDT", baseCoin: "XRP" },
];

const LEVERAGES = [2, 3, 5, 10, 15, 20, 25, 50];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrice(baseCoin: string): number {
  const basePrices: Record<string, number> = {
    BTC: 67000, ETH: 3800, SOL: 175, DOGE: 0.15,
    ARB: 1.2, AVAX: 38, LINK: 16, XRP: 0.55,
  };
  const base = basePrices[baseCoin] || 100;
  return base * randomBetween(0.85, 1.15);
}

async function seed() {
  console.log("Seeding database...");

  await prisma.trade.deleteMany();
  await prisma.dailyStats.deleteMany();
  await prisma.exchange.deleteMany();

  const bybit = await prisma.exchange.create({
    data: {
      name: "bybit",
      apiKey: "mock_bybit_key",
      apiSecret: "mock_bybit_secret",
      label: "Bybit Main",
      isActive: true,
    },
  });

  const binance = await prisma.exchange.create({
    data: {
      name: "binance",
      apiKey: "mock_binance_key",
      apiSecret: "mock_binance_secret",
      label: "Binance Sub",
      isActive: true,
    },
  });

  const exchanges = [bybit, binance];
  const trades = [];
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < 350; i++) {
    const { symbol, baseCoin } = randomChoice(SYMBOLS);
    const side = Math.random() > 0.48 ? "Long" : "Short";
    const leverage = randomChoice(LEVERAGES);
    const marginMode = Math.random() > 0.3 ? "cross" : "isolated";
    const exchange = randomChoice(exchanges);

    const entryPrice = generatePrice(baseCoin);
    const entryQty = randomBetween(0.01, 2) * (baseCoin === "BTC" ? 0.1 : baseCoin === "ETH" ? 1 : 10);
    const entryValue = entryPrice * entryQty;

    // Hold duration: 5 min to 48 hours
    const holdDuration = Math.floor(randomBetween(300, 172800));
    const entryTime = new Date(randomBetween(ninetyDaysAgo, now - holdDuration * 1000));
    const exitTime = new Date(entryTime.getTime() + holdDuration * 1000);

    // PnL: ~60% win rate, wins tend larger than losses
    const isWin = Math.random() < 0.62;
    const pnlPercent = isWin
      ? randomBetween(0.5, 15) * leverage * 0.01
      : -randomBetween(0.3, 8) * leverage * 0.01;

    const priceChange = entryPrice * pnlPercent * (side === "Long" ? 1 : -1);
    const exitPrice = entryPrice + priceChange;
    const exitQty = entryQty;
    const exitValue = exitPrice * exitQty;

    const realizedPnl = (exitValue - entryValue) * (side === "Long" ? 1 : -1);
    const fee = entryValue * 0.001 + exitValue * 0.001; // 0.1% maker/taker
    const fundingFee = Math.random() > 0.7 ? randomBetween(-5, 5) : 0;

    const netPnl = realizedPnl - fee - fundingFee;

    trades.push({
      exchangeId: exchange.id,
      externalId: `mock_${exchange.name}_${i}_${Date.now()}`,
      symbol,
      baseCoin,
      quoteCoin: "USDT",
      side,
      leverage,
      marginMode,
      entryPrice,
      entryQty,
      entryValue,
      entryTime,
      exitPrice,
      exitQty,
      exitValue,
      exitTime,
      realizedPnl: netPnl,
      fee,
      fundingFee,
      pnlPercent: pnlPercent * 100,
      holdDuration,
      isWin: netPnl > 0,
    });
  }

  // Sort by entry time for realistic ordering
  trades.sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());

  for (const trade of trades) {
    await prisma.trade.create({ data: trade });
  }

  // Generate DailyStats from trades
  const dailyMap = new Map<string, typeof trades>();
  for (const t of trades) {
    const dateKey = t.exitTime.toISOString().split("T")[0];
    if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, []);
    dailyMap.get(dateKey)!.push(t);
  }

  for (const [dateStr, dayTrades] of dailyMap) {
    const wins = dayTrades.filter((t) => t.isWin);
    const losses = dayTrades.filter((t) => !t.isWin);
    const grossProfit = wins.reduce((s, t) => s + t.realizedPnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.realizedPnl, 0));

    await prisma.dailyStats.create({
      data: {
        date: new Date(dateStr),
        totalPnl: dayTrades.reduce((s, t) => s + t.realizedPnl, 0),
        tradeCount: dayTrades.length,
        winCount: wins.length,
        lossCount: losses.length,
        winRate: dayTrades.length > 0 ? (wins.length / dayTrades.length) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit,
        avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
        avgLoss: losses.length > 0 ? -(grossLoss / losses.length) : 0,
        maxWin: wins.length > 0 ? Math.max(...wins.map((t) => t.realizedPnl)) : 0,
        maxLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.realizedPnl)) : 0,
        volume: dayTrades.reduce((s, t) => s + t.entryValue + t.exitValue, 0),
        fees: dayTrades.reduce((s, t) => s + t.fee, 0),
      },
    });
  }

  console.log(`Seeded ${trades.length} trades across ${dailyMap.size} days`);
  console.log(`Exchanges: ${exchanges.map((e) => e.label).join(", ")}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
