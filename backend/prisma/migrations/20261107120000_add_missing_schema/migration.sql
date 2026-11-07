-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(255);

-- AlterTable RoomRequest
ALTER TABLE "RoomRequest" ADD COLUMN IF NOT EXISTS "document_url" VARCHAR(255);

-- CreateEnum ResetRequestStatus
DO $$ BEGIN
  CREATE TYPE "ResetRequestStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum IssueSeverity
DO $$ BEGIN
  CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum IssueStatus
DO $$ BEGIN
  CREATE TYPE "IssueStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum MaintenanceType
DO $$ BEGIN
  CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE_PREVENTIVE', 'CORRECTIVE_REPAIR', 'COMPONENT_UPGRADE', 'REPLACEMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable PasswordResetRequest
CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role_code" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "status" "ResetRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolved_by_id" UUID,
    "temp_password" VARCHAR(255),
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable Message
CREATE TABLE IF NOT EXISTS "Message" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID,
    "subject" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_url" VARCHAR(255),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "folder" VARCHAR(20) NOT NULL DEFAULT 'inbox',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_url" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable FacilityIssueTicket
CREATE TABLE IF NOT EXISTS "FacilityIssueTicket" (
    "id" UUID NOT NULL,
    "ticket_number" VARCHAR(30) NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "facility_id" UUID,
    "reported_by_id" UUID NOT NULL,
    "handled_by_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IssueStatus" NOT NULL DEFAULT 'REPORTED',
    "image_url" VARCHAR(255),
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityIssueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable FacilityMaintenanceLog
CREATE TABLE IF NOT EXISTS "FacilityMaintenanceLog" (
    "id" UUID NOT NULL,
    "laboratory_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "performed_by_id" UUID NOT NULL,
    "issue_ticket_id" UUID,
    "maintenance_type" "MaintenanceType" NOT NULL DEFAULT 'ROUTINE_PREVENTIVE',
    "title" VARCHAR(150) NOT NULL,
    "action_taken" TEXT NOT NULL,
    "previous_condition" "FacilityCondition",
    "resulting_condition" "FacilityCondition" NOT NULL DEFAULT 'GOOD',
    "cost" DECIMAL(12,2),
    "vendor" VARCHAR(100),
    "attachment_url" VARCHAR(255),
    "maintenance_date" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityMaintenanceLog_pkey" PRIMARY KEY ("id")
);
