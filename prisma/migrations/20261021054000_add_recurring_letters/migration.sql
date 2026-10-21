-- Persist recurring letter schedules and link generated orders to their source schedule.
ALTER TABLE "Order" ADD COLUMN "recurringLetterId" TEXT;

CREATE TABLE "RecurringLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handwritingStyle" TEXT,
    "frequency" TEXT NOT NULL,
    "nextSendAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringLetter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecurringLetter_userId_idx" ON "RecurringLetter"("userId");
CREATE INDEX "RecurringLetter_recipientId_idx" ON "RecurringLetter"("recipientId");
CREATE INDEX "RecurringLetter_active_nextSendAt_idx" ON "RecurringLetter"("active", "nextSendAt");
CREATE INDEX "Order_recurringLetterId_idx" ON "Order"("recurringLetterId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_recurringLetterId_fkey"
  FOREIGN KEY ("recurringLetterId") REFERENCES "RecurringLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringLetter" ADD CONSTRAINT "RecurringLetter_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringLetter" ADD CONSTRAINT "RecurringLetter_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
