-- CreateTable
CREATE TABLE "SanctionedEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "aliasesJson" TEXT,
    "listSource" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "programs" TEXT,
    "nationality" TEXT,
    "dob" TEXT
);

-- CreateIndex
CREATE INDEX "SanctionedEntity_listSource_idx" ON "SanctionedEntity"("listSource");

-- CreateIndex
CREATE INDEX "SanctionedEntity_fullName_idx" ON "SanctionedEntity"("fullName");
