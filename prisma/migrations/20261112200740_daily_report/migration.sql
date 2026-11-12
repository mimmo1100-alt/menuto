-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "dailyReport" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DailyReportSent" (
    "restaurantId" TEXT NOT NULL,
    "ymd" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportSent_pkey" PRIMARY KEY ("restaurantId","ymd")
);
