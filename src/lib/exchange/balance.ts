import ccxt from "ccxt";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const BALANCE_TIMEOUT_MS = 4000;
const BALANCE_ASSET = "USDT";
const BALANCE_CACHE_TTL_MS = 60_000;
const BALANCE_FAILURE_TTL_MS = 15_000;

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

type BalanceClient = { fetchBalance(params?: object): Promise<unknown> };
type BalanceClientConstructor = new (config: object) => BalanceClient;

interface CachedBalance {
  value: number | null;
  expiresAt: number;
}

// 客户端与余额缓存挂在 globalThis 上：和 prisma 单例一样躲过开发模式的模块热替换。
// ccxt 实例的首次请求会拉取整个交易所的合约列表（Binance/Bybit 各约 1.4 秒），复用实例后只付一次。
const globalForBalance = globalThis as unknown as {
  walletBalanceClients?: Map<string, BalanceClient>;
  walletBalanceCache?: Map<string, CachedBalance>;
  walletBalanceInflight?: Map<string, Promise<number | null>>;
};
const balanceClients = (globalForBalance.walletBalanceClients ??= new Map());
const balanceCache = (globalForBalance.walletBalanceCache ??= new Map());
const balanceInflight = (globalForBalance.walletBalanceInflight ??= new Map());

function getBalanceClient(exchange: ExchangeCredentialRecord): BalanceClient | null {
  const clientKey = `${exchange.id}:${exchange.apiKey}`;
  const existing = balanceClients.get(clientKey);
  if (existing) return existing;

  const ExchangeClass = (ccxt as unknown as Record<string, BalanceClientConstructor | undefined>)[exchange.name];
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
  balanceClients.set(clientKey, client);
  return client;
}

async function fetchExchangeUsdtBalance(exchange: ExchangeCredentialRecord): Promise<number | null> {
  const client = getBalanceClient(exchange);
  if (!client) return null;

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

/** 同一交易所 60 秒内复用上次结果；取不到时只缓存 15 秒，网络恢复后能尽快重试。并发的渲染共用同一次请求。 */
function getExchangeUsdtBalance(exchange: ExchangeCredentialRecord): Promise<number | null> {
  const cached = balanceCache.get(exchange.id);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

  const inflight = balanceInflight.get(exchange.id);
  if (inflight) return inflight;

  const request = fetchExchangeUsdtBalance(exchange)
    .then((value) => {
      const ttl = value === null ? BALANCE_FAILURE_TTL_MS : BALANCE_CACHE_TTL_MS;
      balanceCache.set(exchange.id, { value, expiresAt: Date.now() + ttl });
      return value;
    })
    .finally(() => {
      balanceInflight.delete(exchange.id);
    });
  balanceInflight.set(exchange.id, request);
  return request;
}

/** 顶栏「刷新」调用：丢掉缓存的余额，下一次渲染重新向交易所请求；ccxt 实例保留。 */
export function invalidateWalletBalanceCache(): void {
  balanceCache.clear();
}

/** 仅供测试：清空客户端、余额缓存与进行中的请求。 */
export function resetWalletBalanceState(): void {
  balanceClients.clear();
  balanceCache.clear();
  balanceInflight.clear();
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

  const balances = await Promise.all(exchanges.map(getExchangeUsdtBalance));
  const validBalances = balances.filter((balance): balance is number => balance !== null);

  if (validBalances.length === 0) return { asset: BALANCE_ASSET, total: null };

  return {
    asset: BALANCE_ASSET,
    total: validBalances.reduce((sum, balance) => sum + balance, 0),
  };
}
