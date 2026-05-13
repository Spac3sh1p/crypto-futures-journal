-- AlterTable: Add makerFee and takerFee columns
ALTER TABLE "Trade" ADD COLUMN "makerFee" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Trade" ADD COLUMN "takerFee" REAL NOT NULL DEFAULT 0;

-- DropIndex: Remove global unique on externalId (replaced by composite)
DROP INDEX "Trade_externalId_key";

-- CreateIndex: Composite unique per exchange
CREATE UNIQUE INDEX "Trade_exchangeId_externalId_key" ON "Trade"("exchangeId", "externalId");
