/*
  Warnings:

  - A unique constraint covering the columns `[plaidTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'PLAID');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "plaidAccountId" TEXT,
ADD COLUMN     "plaidTransactionId" TEXT,
ADD COLUMN     "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "PlaidItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "syncCursor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlaidItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaidAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plaidItemId" TEXT NOT NULL,

    CONSTRAINT "PlaidAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaidItem_itemId_key" ON "PlaidItem"("itemId");

-- CreateIndex
CREATE INDEX "PlaidItem_userId_idx" ON "PlaidItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaidAccount_accountId_key" ON "PlaidAccount"("accountId");

-- CreateIndex
CREATE INDEX "PlaidAccount_plaidItemId_idx" ON "PlaidAccount"("plaidItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_plaidAccountId_idx" ON "Transaction"("plaidAccountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_plaidAccountId_fkey" FOREIGN KEY ("plaidAccountId") REFERENCES "PlaidAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaidItem" ADD CONSTRAINT "PlaidItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaidAccount" ADD CONSTRAINT "PlaidAccount_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
