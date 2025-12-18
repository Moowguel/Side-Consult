-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "diagnosis" TEXT,
    "triageId" TEXT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    CONSTRAINT "Appointment_triageId_fkey" FOREIGN KEY ("triageId") REFERENCES "Triage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("date", "diagnosis", "doctorId", "id", "patientId", "status", "triageId") SELECT "date", "diagnosis", "doctorId", "id", "patientId", "status", "triageId" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_triageId_key" ON "Appointment"("triageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
