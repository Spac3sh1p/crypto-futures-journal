-- CreateTable
CREATE TABLE "AccountFlow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchangeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "symbol" TEXT,
    "info" TEXT,
    "time" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountFlow_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountFlow_exchangeId_externalId_key" ON "AccountFlow"("exchangeId", "externalId");

-- CreateIndex
CREATE INDEX "AccountFlow_exchangeId_idx" ON "AccountFlow"("exchangeId");

-- CreateIndex
CREATE INDEX "AccountFlow_time_idx" ON "AccountFlow"("time");

-- CreateIndex
CREATE INDEX "AccountFlow_type_idx" ON "AccountFlow"("type");

-- CreateIndex
CREATE INDEX "AccountFlow_asset_idx" ON "AccountFlow"("asset");
