-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- Remove default after adding column
ALTER TABLE "Order" ALTER COLUMN "orderNumber" DROP DEFAULT;
