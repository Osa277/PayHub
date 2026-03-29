-- This is a baseline migration for an existing database

-- BankAccount table (new)
CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_userId_accountNumber_bankCode_key" ON "BankAccount"("userId", "accountNumber", "bankCode");
CREATE INDEX IF NOT EXISTS "BankAccount_userId_idx" ON "BankAccount"("userId");

-- Add bankAccountId to Transaction if it doesn't exist
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL;

COMMIT;
