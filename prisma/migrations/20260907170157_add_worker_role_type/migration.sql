-- CreateTable
CREATE TABLE "worker_role_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_role_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worker_role_types_name_key" ON "worker_role_types"("name");
