-- CreateTable
CREATE TABLE "RevokedMobileToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedMobileToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedMobileToken_jti_key" ON "RevokedMobileToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedMobileToken_expiresAt_idx" ON "RevokedMobileToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RevokedMobileToken_userId_idx" ON "RevokedMobileToken"("userId");

