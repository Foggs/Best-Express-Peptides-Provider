-- CreateTable
CREATE TABLE "StockSyncFailure" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT,
    "items" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockSyncFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockSyncFailure_resolved_createdAt_idx" ON "StockSyncFailure"("resolved", "createdAt");
