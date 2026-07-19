-- AlterTable
ALTER TABLE "KycCase" ADD COLUMN "craBand" TEXT;
ALTER TABLE "KycCase" ADD COLUMN "craLastAssessedAt" DATETIME;
ALTER TABLE "KycCase" ADD COLUMN "craNextReviewAt" DATETIME;
ALTER TABLE "KycCase" ADD COLUMN "craScore" INTEGER;

-- CreateIndex
CREATE INDEX "KycCase_craBand_idx" ON "KycCase"("craBand");
