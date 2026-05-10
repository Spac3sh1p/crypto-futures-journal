-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchangeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseCoin" TEXT NOT NULL,
    "quoteCoin" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "leverage" REAL NOT NULL,
    "marginMode" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "entryQty" REAL NOT NULL,
    "entryValue" REAL NOT NULL,
    "entryTime" DATETIME NOT NULL,
    "exitPrice" REAL NOT NULL,
    "exitQty" REAL NOT NULL,
    "exitValue" REAL NOT NULL,
    "exitTime" DATETIME NOT NULL,
    "realizedPnl" REAL NOT NULL,
    "fee" REAL NOT NULL,
    "fundingFee" REAL NOT NULL DEFAULT 0,
    "pnlPercent" REAL NOT NULL,
    "holdDuration" INTEGER NOT NULL,
    "isWin" BOOLEAN NOT NULL,
    "tags" TEXT,
    "notes" TEXT,
    "rating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalPnl" REAL NOT NULL,
    "tradeCount" INTEGER NOT NULL,
    "winCount" INTEGER NOT NULL,
    "lossCount" INTEGER NOT NULL,
    "winRate" REAL NOT NULL,
    "profitFactor" REAL NOT NULL,
    "avgWin" REAL NOT NULL,
    "avgLoss" REAL NOT NULL,
    "maxWin" REAL NOT NULL,
    "maxLoss" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "fees" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchangeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tradesAdded" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_externalId_key" ON "Trade"("externalId");

-- CreateIndex
CREATE INDEX "Trade_exchangeId_idx" ON "Trade"("exchangeId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_side_idx" ON "Trade"("side");

-- CreateIndex
CREATE INDEX "Trade_entryTime_idx" ON "Trade"("entryTime");

-- CreateIndex
CREATE INDEX "Trade_exitTime_idx" ON "Trade"("exitTime");

-- CreateIndex
CREATE INDEX "Trade_isWin_idx" ON "Trade"("isWin");

-- CreateIndex
CREATE INDEX "Trade_baseCoin_idx" ON "Trade"("baseCoin");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");
