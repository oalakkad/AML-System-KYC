-- CreateTable
CREATE TABLE "InvestigationCounter" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "counter" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StrCounter" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "counter" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "InvestigationCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseRef" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "kycCaseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "findings" TEXT,
    "openedById" TEXT,
    "closedById" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigationCase_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestigationCase_kycCaseId_fkey" FOREIGN KEY ("kycCaseId") REFERENCES "KycCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestigationCase_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvestigationCase_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportRef" TEXT NOT NULL,
    "kycCaseId" TEXT NOT NULL,
    "investigationCaseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PREPARATION',
    "narrative" TEXT,
    "preparedById" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StrReport_kycCaseId_fkey" FOREIGN KEY ("kycCaseId") REFERENCES "KycCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StrReport_investigationCaseId_fkey" FOREIGN KEY ("investigationCaseId") REFERENCES "InvestigationCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StrReport_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationCase_caseRef_key" ON "InvestigationCase"("caseRef");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationCase_alertId_key" ON "InvestigationCase"("alertId");

-- CreateIndex
CREATE INDEX "InvestigationCase_status_idx" ON "InvestigationCase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StrReport_reportRef_key" ON "StrReport"("reportRef");

-- CreateIndex
CREATE INDEX "StrReport_status_idx" ON "StrReport"("status");
