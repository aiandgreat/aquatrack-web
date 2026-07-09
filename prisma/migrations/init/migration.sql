-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('PIPELINE_BREACH_PRESSURE_DROP', 'HIGH_TURBIDITY', 'HIGH_MINERAL_CONTENT_TDS', 'UNCLASSIFIED_INFRASTRUCTURE_ANOMALY', 'CHEMICAL_DISCOLORATION_CONTAMINATION');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'DISPATCHED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('PUMP_STATION', 'HOUSEHOLD_EDGE');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FIELD_ENGINEER_TECHNICIAN', 'CONSUMER_RESIDENT');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "TelemetryNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geom" geometry(Point, 4326) NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'ONLINE',

    CONSTRAINT "TelemetryNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryReading" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "turbidity" DOUBLE PRECISION NOT NULL,
    "tds" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "translatedText" TEXT,
    "summary" TEXT,
    "category" "IssueCategory",
    "urgency" "UrgencyLevel",
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "aiStatus" "AiStatus" NOT NULL DEFAULT 'PENDING',
    "imageUrl" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geom" geometry(Point, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticAlert" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "complaintCount" INTEGER NOT NULL DEFAULT 1,
    "geminiAnalysis" JSONB NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "engineerId" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceAccountNo" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelemetryReading_nodeId_timestamp_idx" ON "TelemetryReading"("nodeId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "TelemetryReading" ADD CONSTRAINT "TelemetryReading_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TelemetryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticAlert" ADD CONSTRAINT "DiagnosticAlert_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TelemetryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DiagnosticAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateSpatialIndex
CREATE INDEX IF NOT EXISTS "TelemetryNode_geom_idx" ON "TelemetryNode" USING GIST (geom);
CREATE INDEX IF NOT EXISTS "Complaint_geom_idx" ON "Complaint" USING GIST (geom);
