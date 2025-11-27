-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "extraNotes" TEXT,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2),
    "quota" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripApplication" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "ogrenciAdSoyad" TEXT NOT NULL,
    "veliAdSoyad" TEXT NOT NULL,
    "ogrenciSinifi" TEXT NOT NULL,
    "veliTelefon" TEXT NOT NULL,
    "ogrenciTelefon" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_isActive_startDate_idx" ON "Trip"("isActive", "startDate");

-- CreateIndex
CREATE INDEX "TripApplication_tripId_createdAt_idx" ON "TripApplication"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "TripApplication_ogrenciSinifi_idx" ON "TripApplication"("ogrenciSinifi");

-- AddForeignKey
ALTER TABLE "TripApplication" ADD CONSTRAINT "TripApplication_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
