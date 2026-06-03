import ccxt from "ccxt";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const BALANCE_TIMEOUT_MS = 4000;
const BALANCE_ASSET = "USDT";

interface ExchangeCredentialRecord {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
}

export interface WalletBalanceSummary {
  asset: string;
  total: number | null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readPath(source: unknown, path: string[]): unknown {
  let current = source;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function extractUsdtBalance(balance: unknown): number | null {
  const directCandidates = [
    readPath(balance, ["total", BALANCE_ASSET]),
    readPath(balance, [BALANCE_ASSET, "total"]),
    readPath(balance, ["free", BALANCE_ASSET]),
    readPath(balance, [BALANCE_ASSET, "free"]),
  ];

  for (const candidate of directCandidates) {
    const parsed = toNumber(candidate);
    if (parsed !== null) return parsed;
  }

  const info = readPath(balance, ["info"]);
  const bybitAccounts = readPath(info, ["result", "list"]);
  if (Array.isArray(bybitAccounts)) {
    for (const account of bybitAccounts) {
      const coins = readPath(account, ["coin"]);
      if (Array.isArray(coins)) {
        const usdtCoin = coins.find((coin) => readPath(coin, ["coin"]) === BALANCE_ASSET);
        const coinCandidates = [
          readPath(usdtCoin, ["walletBalance"]),
          readPath(usdtCoin, ["equity"]),
          readPath(usdtCoin, ["availableToWithdraw"]),
        ];
        for (const candidate of coinCandidates) {
          const parsed = toNumber(candidate);
          if (parsed !== null) return parsed;
        }
      }

      const accountCandidates = [
        readPath(account, ["totalWalletBalance"]),
        readPath(account, ["totalEquity"]),
      ];
      for (const candidate of accountCandidates) {
        const parsed = toNumber(candidate);
        if (parsed !== null) return parsed;
      }
    }
  }

  const binanceAssets = readPath(info, ["assets"]);
  if (Array.isArray(binanceAssets)) {
    const usdtAsset = binanceAssets.find((asset) => readPath(asset, ["asset"]) === BALANCE_ASSET);
    const assetCandidates = [
      readPath(usdtAsset, ["walletBalance"]),
      readPath(usdtAsset, ["availableBalance"]),
    ];
    for (const candidate of assetCandidates) {
      const parsed = toNumber(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

function balanceParamCandidatesFor(exchangeName: string): Array<Record<string, string>> {
  if (exchangeName === "bybit") {
    return [
      {},
      { type: "swap", category: "linear" },
      { accountType: "UNIFIED" },
      { type: "swap", accountType: "UNIFIED" },
    ];
  }
  if (exchangeName === "binance") return [{ type: "future" }, {}];
  return [{}];
}

function clientOptionsFor(exchangeName: string): Record<string, string> {
  if (exchangeName === "binance") return { defaultType: "future" };
  return { defaultType: "swap" };
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Balance request timed out")), BALANCE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fetchExchangeUsdtBalance(exchange: ExchangeCredentialRecord): Promise<number | null> {
  const ExchangeClass = (ccxt as unknown as Record<string, new (config: object) => { fetchBalance(params?: object): Promise<unknown> }>)[exchange.name];
  if (!ExchangeClass) return null;

  let apiSecret: string;
  try {
    apiSecret = decryptSecret(exchange.apiSecret);
  } catch {
    return null;
  }

  const client = new ExchangeClass({
    apiKey: exchange.apiKey,
    secret: apiSecret,
    options: clientOptionsFor(exchange.name),
  });

  for (const params of balanceParamCandidatesFor(exchange.name)) {
    try {
      const balance = await withTimeout(client.fetchBalance(params));
      const parsed = extractUsdtBalance(balance);
      if (parsed !== null) return parsed;
    } catch {
      // Try the next parameter shape. Different account modes expose balance through different endpoints.
    }
  }

  return null;
}

export async function getWalletBalance(exchangeId?: string): Promise<WalletBalanceSummary> {
  const exchanges = await prisma.exchange.findMany({
    where: {
      isActive: true,
      ...(exchangeId ? { id: exchangeId } : {}),
    },
    select: {
      id: true,
      name: true,
      apiKey: true,
      apiSecret: true,
    },
  });

  if (exchanges.length === 0) return { asset: BALANCE_ASSET, total: null };

  const balances = await Promise.all(exchanges.map(fetchExchangeUsdtBalance));
  const validBalances = balances.filter((balance): balance is number => balance !== null);

  if (validBalances.length === 0) return { asset: BALANCE_ASSET, total: null };

  return {
    asset: BALANCE_ASSET,
    total: validBalances.reduce((sum, balance) => sum + balance, 0),
  };
}
