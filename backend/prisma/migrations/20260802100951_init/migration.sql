-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('CHECKED_IN', 'IN_USE', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LaboratoryStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "FacilityCondition" AS ENUM ('GOOD', 'DAMAGED', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "CalendarStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "keycloak_id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "status" "UserStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "start_at" TIMESTAMP(6) NOT NULL,
    "end_at" TIMESTAMP(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicCalendar" (
    "id" UUID NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "CalendarStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "AcademicCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratory" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "maximum_capacity" INTEGER NOT NULL,
    "image" VARCHAR(255),
    "description" TEXT,
    "status" "LaboratoryStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryFacility" (
    "id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" "FacilityCondition" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "LaboratoryFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalHour" (
    "id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "open_time" TIME(6) NOT NULL,
    "close_time" TIME(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "OperationalHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "academic_calendar_id" UUID NOT NULL,
    "course_name" VARCHAR(100) NOT NULL,
    "lecturer_name" VARCHAR(100) NOT NULL,
    "class_name" VARCHAR(30) NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "ScheduleStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomRequest" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "approved_by" UUID,
    "activity_name" VARCHAR(100) NOT NULL,
    "course_name" VARCHAR(100),
    "class_name" VARCHAR(30),
    "description" TEXT NOT NULL,
    "request_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "participant_count" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "RoomRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomUsage" (
    "id" UUID NOT NULL,
    "request_id" UUID,
    "schedule_id" UUID,
    "checked_in_by" UUID NOT NULL,
    "checked_out_by" UUID,
    "check_in_time" TIMESTAMP(6) NOT NULL,
    "check_out_time" TIMESTAMP(6),
    "status" "UsageStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "RoomUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryStatusHistory" (
    "id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "usage_id" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "status" "LaboratoryStatus" NOT NULL,
    "remarks" TEXT,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaboratoryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_keycloak_id_key" ON "User"("keycloak_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Laboratory_code_key" ON "Laboratory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_code_key" ON "Facility"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryFacility_laboratory_id_facility_id_key" ON "LaboratoryFacility"("laboratory_id", "facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalHour_laboratory_id_day_of_week_key" ON "OperationalHour"("laboratory_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryFacility" ADD CONSTRAINT "LaboratoryFacility_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryFacility" ADD CONSTRAINT "LaboratoryFacility_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalHour" ADD CONSTRAINT "OperationalHour_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_academic_calendar_id_fkey" FOREIGN KEY ("academic_calendar_id") REFERENCES "AcademicCalendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRequest" ADD CONSTRAINT "RoomRequest_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRequest" ADD CONSTRAINT "RoomRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRequest" ADD CONSTRAINT "RoomRequest_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUsage" ADD CONSTRAINT "RoomUsage_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "RoomRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUsage" ADD CONSTRAINT "RoomUsage_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUsage" ADD CONSTRAINT "RoomUsage_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUsage" ADD CONSTRAINT "RoomUsage_checked_out_by_fkey" FOREIGN KEY ("checked_out_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryStatusHistory" ADD CONSTRAINT "LaboratoryStatusHistory_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryStatusHistory" ADD CONSTRAINT "LaboratoryStatusHistory_usage_id_fkey" FOREIGN KEY ("usage_id") REFERENCES "RoomUsage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryStatusHistory" ADD CONSTRAINT "LaboratoryStatusHistory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
