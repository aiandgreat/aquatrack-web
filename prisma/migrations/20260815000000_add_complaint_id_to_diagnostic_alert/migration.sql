-- AlterTable
ALTER TABLE "DiagnosticAlert" ADD COLUMN     "complaintId" TEXT;

-- CreateIndex
CREATE INDEX "DiagnosticAlert_nodeId_idx" ON "DiagnosticAlert"("nodeId");

-- CreateIndex
CREATE INDEX "DiagnosticAlert_complaintId_idx" ON "DiagnosticAlert"("complaintId");

-- AddForeignKey
ALTER TABLE "DiagnosticAlert" ADD CONSTRAINT "DiagnosticAlert_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
