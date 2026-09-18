-- CreateTable
CREATE TABLE "public"."Translation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "detected" TEXT,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_key_key" ON "public"."Translation"("key");

-- CreateIndex
CREATE INDEX "Translation_to_idx" ON "public"."Translation"("to");
