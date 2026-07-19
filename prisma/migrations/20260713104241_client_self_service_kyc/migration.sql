-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KycCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "clientType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "formType" TEXT NOT NULL,
    "clientNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "makerId" TEXT,
    "clientMakerId" TEXT,
    "checkerId" TEXT,
    "approverId" TEXT,
    "systemRiskScore" INTEGER,
    "systemRiskRating" TEXT,
    "riskFactorsJson" TEXT,
    "finalRiskRating" TEXT,
    "overrideJustification" TEXT,
    "submittedAt" DATETIME,
    "complianceDecision" TEXT,
    "complianceNotes" TEXT,
    "complianceAt" DATETIME,
    "managerDecision" TEXT,
    "managerNotes" TEXT,
    "managerAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientEmail" TEXT,
    "clientSignedAt" DATETIME,
    "clientSignatureName" TEXT,
    CONSTRAINT "KycCase_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KycCase_clientMakerId_fkey" FOREIGN KEY ("clientMakerId") REFERENCES "ClientUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KycCase_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KycCase_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_KycCase" ("approverId", "caseNumber", "checkerId", "clientEmail", "clientNo", "clientSignatureName", "clientSignedAt", "clientType", "complianceAt", "complianceDecision", "complianceNotes", "createdAt", "finalRiskRating", "formType", "id", "makerId", "managerAt", "managerDecision", "managerNotes", "overrideJustification", "riskFactorsJson", "status", "submittedAt", "systemRiskRating", "systemRiskScore", "updatedAt") SELECT "approverId", "caseNumber", "checkerId", "clientEmail", "clientNo", "clientSignatureName", "clientSignedAt", "clientType", "complianceAt", "complianceDecision", "complianceNotes", "createdAt", "finalRiskRating", "formType", "id", "makerId", "managerAt", "managerDecision", "managerNotes", "overrideJustification", "riskFactorsJson", "status", "submittedAt", "systemRiskRating", "systemRiskScore", "updatedAt" FROM "KycCase";
DROP TABLE "KycCase";
ALTER TABLE "new_KycCase" RENAME TO "KycCase";
CREATE UNIQUE INDEX "KycCase_caseNumber_key" ON "KycCase"("caseNumber");
CREATE INDEX "KycCase_status_idx" ON "KycCase"("status");
CREATE INDEX "KycCase_makerId_status_idx" ON "KycCase"("makerId", "status");
CREATE INDEX "KycCase_clientEmail_idx" ON "KycCase"("clientEmail");
CREATE INDEX "KycCase_clientMakerId_idx" ON "KycCase"("clientMakerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
