-- AlterTable
ALTER TABLE "User" ADD COLUMN "birthYear" INTEGER;
ALTER TABLE "User" ADD COLUMN "consentAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "region" TEXT;

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "Device_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "AccessLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HealthRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "glucose" INTEGER,
    "heartRate" INTEGER,
    "spo2" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "deviceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "HealthRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HealthRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_HealthRecord" ("createdAt", "diastolic", "glucose", "id", "notes", "patientId", "systolic") SELECT "createdAt", "diastolic", "glucose", "id", "notes", "patientId", "systolic" FROM "HealthRecord";
DROP TABLE "HealthRecord";
ALTER TABLE "new_HealthRecord" RENAME TO "HealthRecord";
CREATE TABLE "new_Triage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symptoms" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "notes" TEXT,
    "painLevel" INTEGER,
    "age" INTEGER,
    "region" TEXT,
    "source" TEXT NOT NULL DEFAULT 'APP',
    "ruleSeverity" INTEGER,
    "aiSeverity" INTEGER,
    "aiConfidence" REAL,
    "aiFactors" TEXT,
    "specialty" TEXT,
    "doctorSeverity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "Triage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Triage" ("createdAt", "id", "notes", "patientId", "severity", "symptoms") SELECT "createdAt", "id", "notes", "patientId", "severity", "symptoms" FROM "Triage";
DROP TABLE "Triage";
ALTER TABLE "new_Triage" RENAME TO "Triage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_key" ON "Device"("token");
