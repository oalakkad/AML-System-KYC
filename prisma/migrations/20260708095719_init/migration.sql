-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "fatfStatus" TEXT NOT NULL DEFAULT 'NONE',
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "KycCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "clientNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "makerId" TEXT NOT NULL,
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
    CONSTRAINT "KycCase_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KycCase_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KycCase_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KycProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "title" TEXT,
    "fullName" TEXT,
    "dobEnc" TEXT,
    "nationality" TEXT,
    "otherNationalitiesJson" TEXT,
    "countryOfBirth" TEXT,
    "otherResidencyCountry" TEXT,
    "civilIdNoEnc" TEXT,
    "civilIdExpiry" DATETIME,
    "passportNoEnc" TEXT,
    "passportExpiry" DATETIME,
    "residenceCountry" TEXT,
    "residenceCity" TEXT,
    "residenceAddressEnc" TEXT,
    "mobileEnc" TEXT,
    "telEnc" TEXT,
    "emailEnc" TEXT,
    "employmentStatus" TEXT,
    "employer" TEXT,
    "sector" TEXT,
    "jobTitle" TEXT,
    "workAddress" TEXT,
    "workPhoneEnc" TEXT,
    "yearsOfWork" INTEGER,
    "selfEmploymentDetails" TEXT,
    "sourcesOfIncomeJson" TEXT,
    "otherIncomeDetail" TEXT,
    "annualIncomeKd" REAL,
    "approxWealthKd" REAL,
    "bankBeneficiaryName" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankCountry" TEXT,
    "bankAccountNoEnc" TEXT,
    "bankIbanEnc" TEXT,
    "bankSwift" TEXT,
    "bankCurrency" TEXT,
    "isManagedByOther" BOOLEAN NOT NULL DEFAULT false,
    "managerType" TEXT,
    "managerTypeOther" TEXT,
    "boName" TEXT,
    "boNationality" TEXT,
    "boCivilIdEnc" TEXT,
    "boPassportEnc" TEXT,
    "boAddressEnc" TEXT,
    "boRelation" TEXT,
    "isPep" BOOLEAN NOT NULL DEFAULT false,
    "pepPositionsJson" TEXT,
    "hasPepRelative" BOOLEAN NOT NULL DEFAULT false,
    "pepName" TEXT,
    "pepRelationship" TEXT,
    "pepPositionDetails" TEXT,
    "isRelatedParty" BOOLEAN NOT NULL DEFAULT false,
    "relatedPartiesJson" TEXT,
    "hasControl" BOOLEAN NOT NULL DEFAULT false,
    "isBoardMember" BOOLEAN NOT NULL DEFAULT false,
    "docsChecklistJson" TEXT,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "KycProfile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "KycCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "KycCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "detailsJson" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "KycCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CaseCounter" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "counter" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KycCase_caseNumber_key" ON "KycCase"("caseNumber");

-- CreateIndex
CREATE INDEX "KycCase_status_idx" ON "KycCase"("status");

-- CreateIndex
CREATE INDEX "KycCase_makerId_status_idx" ON "KycCase"("makerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KycProfile_caseId_key" ON "KycProfile"("caseId");

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_caseId_createdAt_idx" ON "AuditLog"("caseId", "createdAt");
