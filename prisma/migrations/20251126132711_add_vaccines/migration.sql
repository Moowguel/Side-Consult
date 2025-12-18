-- CreateTable
CREATE TABLE "Vaccine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "batch" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Vaccine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
