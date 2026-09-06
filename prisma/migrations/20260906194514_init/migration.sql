-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "teamZone" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "managerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" TEXT,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "teamZone" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "coordinatorName" TEXT NOT NULL,
    "managerId" TEXT,
    "managerName" TEXT,
    "status" TEXT NOT NULL,
    "standardRate" DOUBLE PRECISION NOT NULL,
    "voterRegistration" TEXT,
    "voterZone" TEXT,
    "voterSection" TEXT,
    "voterCity" TEXT,
    "voterState" TEXT,
    "voterDocumentPhoto" TEXT,
    "preferredPaymentMethod" TEXT NOT NULL,
    "pixType" TEXT,
    "pixKey" TEXT,
    "pixAccountHolder" TEXT,
    "pixAccountHolderCpf" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "bankAccountType" TEXT,
    "approvalStatus" TEXT,
    "approvalDate" TEXT,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "approvalNotes" TEXT,
    "rejectionReason" TEXT,
    "registrationDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_records" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "workerRole" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "coordinatorName" TEXT NOT NULL,
    "managerId" TEXT,
    "managerName" TEXT,
    "teamZone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "shift" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TEXT,
    "rejectedById" TEXT,
    "rejectedByName" TEXT,
    "rejectedAt" TEXT,
    "rejectionReason" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TEXT,
    "paidById" TEXT,
    "paidByName" TEXT,
    "paidAt" TEXT,
    "receiptUrl" TEXT,
    "receiptFileName" TEXT,
    "deliveredByName" TEXT,
    "receivedBy" TEXT,
    "receiptConfirmed" BOOLEAN,
    "cashNotes" TEXT,
    "receiptNumber" TEXT,
    "paymentBatchId" TEXT,
    "paymentBatchNumber" TEXT,
    "isDuplicateOverridden" BOOLEAN,
    "overrideAdminId" TEXT,
    "overrideAdminName" TEXT,
    "pixKey" TEXT,
    "pixType" TEXT,
    "pixAccountHolder" TEXT,
    "pixAccountHolderCpf" TEXT,
    "auditLog" JSONB,
    "reversalReason" TEXT,
    "reversalAt" TEXT,
    "revertedByName" TEXT,
    "createdAtDb" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_absences" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "worker_absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_batches" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalPeople" INTEGER NOT NULL,
    "pixCount" INTEGER NOT NULL DEFAULT 0,
    "pixAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashCount" INTEGER NOT NULL DEFAULT 0,
    "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyIds" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "payment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "workerCpf" TEXT NOT NULL,
    "workerRole" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referencePeriod" TEXT NOT NULL,
    "description" TEXT,
    "diariaIds" JSONB,
    "pixKey" TEXT,
    "pixType" TEXT,
    "bankName" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "deliveredByName" TEXT,
    "receivedBy" TEXT,
    "signedByWorker" BOOLEAN,
    "signedAt" TEXT,
    "isReverted" BOOLEAN,
    "reversalReason" TEXT,
    "reversalAt" TEXT,
    "revertedByName" TEXT,

    CONSTRAINT "financial_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_reversals" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "revertedById" TEXT NOT NULL,
    "revertedByName" TEXT NOT NULL,
    "revertedByRole" TEXT NOT NULL,
    "diariaIds" JSONB NOT NULL,
    "receiptNumber" TEXT,
    "referencePeriod" TEXT,

    CONSTRAINT "payment_reversals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_managerId_idx" ON "users"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "workers_cpf_key" ON "workers"("cpf");

-- CreateIndex
CREATE INDEX "workers_coordinatorId_idx" ON "workers"("coordinatorId");

-- CreateIndex
CREATE INDEX "workers_managerId_idx" ON "workers"("managerId");

-- CreateIndex
CREATE INDEX "workers_status_idx" ON "workers"("status");

-- CreateIndex
CREATE INDEX "daily_records_workerId_idx" ON "daily_records"("workerId");

-- CreateIndex
CREATE INDEX "daily_records_coordinatorId_idx" ON "daily_records"("coordinatorId");

-- CreateIndex
CREATE INDEX "daily_records_managerId_idx" ON "daily_records"("managerId");

-- CreateIndex
CREATE INDEX "daily_records_date_idx" ON "daily_records"("date");

-- CreateIndex
CREATE INDEX "daily_records_status_idx" ON "daily_records"("status");

-- CreateIndex
CREATE INDEX "daily_records_batchId_idx" ON "daily_records"("batchId");

-- CreateIndex
CREATE INDEX "worker_absences_workerId_idx" ON "worker_absences"("workerId");

-- CreateIndex
CREATE INDEX "worker_absences_date_idx" ON "worker_absences"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payment_batches_batchNumber_key" ON "payment_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "financial_payments_workerId_idx" ON "financial_payments"("workerId");
