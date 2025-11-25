-- AlterTable
ALTER TABLE "User" ADD COLUMN     "returnAddress1" TEXT,
ADD COLUMN     "returnAddress2" TEXT,
ADD COLUMN     "returnCity" TEXT,
ADD COLUMN     "returnCountry" TEXT DEFAULT 'US',
ADD COLUMN     "returnName" TEXT,
ADD COLUMN     "returnState" TEXT,
ADD COLUMN     "returnZip" TEXT;

-- CreateTable
CREATE TABLE "MailOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thanksIoOrderId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "recipientCount" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailOrder_thanksIoOrderId_key" ON "MailOrder"("thanksIoOrderId");

-- CreateIndex
CREATE INDEX "MailOrder_userId_idx" ON "MailOrder"("userId");

-- CreateIndex
CREATE INDEX "MailOrder_thanksIoOrderId_idx" ON "MailOrder"("thanksIoOrderId");

-- AddForeignKey
ALTER TABLE "MailOrder" ADD CONSTRAINT "MailOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
