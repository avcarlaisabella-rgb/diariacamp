import { prisma } from '@/lib/prisma';
import type {
  User,
  Worker,
  DailyRecord,
  WorkerAbsence,
  PaymentBatch,
  FinancialPayment,
  PaymentReversal,
} from '@/types';

/** Converte uma linha do Prisma (User) para o tipo usado pelo front-end. */
export function mapUser(row: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  teamZone: string | null;
  phone: string | null;
  active: boolean;
  managerId: string | null;
  managerName: string | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User['role'],
    avatar: row.avatar,
    teamZone: row.teamZone ?? undefined,
    phone: row.phone ?? undefined,
    active: row.active,
    managerId: row.managerId ?? undefined,
    managerName: row.managerName ?? undefined,
  };
}

export async function getBootstrapData(): Promise<{
  users: User[];
  workers: Worker[];
  diarias: DailyRecord[];
  absences: WorkerAbsence[];
  paymentBatches: PaymentBatch[];
  financialPayments: FinancialPayment[];
  paymentReversals: PaymentReversal[];
}> {
  const [usersRaw, workers, diariasRaw, absences, paymentBatchesRaw, financialPaymentsRaw, paymentReversalsRaw] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.worker.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailyRecord.findMany({ orderBy: { createdAtDb: 'desc' } }),
      prisma.workerAbsence.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.paymentBatch.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.financialPayment.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.paymentReversal.findMany({ orderBy: { date: 'desc' } }),
    ]);

  const users = usersRaw.map(mapUser);

  const diarias: DailyRecord[] = diariasRaw.map((d) => ({
    ...d,
    batchId: d.batchId ?? undefined,
    managerId: d.managerId ?? undefined,
    managerName: d.managerName ?? undefined,
    notes: d.notes ?? undefined,
    approvedById: d.approvedById ?? undefined,
    approvedByName: d.approvedByName ?? undefined,
    approvedAt: d.approvedAt ?? undefined,
    rejectedById: d.rejectedById ?? undefined,
    rejectedByName: d.rejectedByName ?? undefined,
    rejectedAt: d.rejectedAt ?? undefined,
    rejectionReason: d.rejectionReason ?? undefined,
    updatedById: d.updatedById ?? undefined,
    updatedByName: d.updatedByName ?? undefined,
    updatedAt: d.updatedAt ?? undefined,
    paidById: d.paidById ?? undefined,
    paidByName: d.paidByName ?? undefined,
    paidAt: d.paidAt ?? undefined,
    receiptUrl: d.receiptUrl ?? undefined,
    receiptFileName: d.receiptFileName ?? undefined,
    deliveredByName: d.deliveredByName ?? undefined,
    receivedBy: d.receivedBy ?? undefined,
    receiptConfirmed: d.receiptConfirmed ?? undefined,
    cashNotes: d.cashNotes ?? undefined,
    receiptNumber: d.receiptNumber ?? undefined,
    paymentBatchId: d.paymentBatchId ?? undefined,
    paymentBatchNumber: d.paymentBatchNumber ?? undefined,
    isDuplicateOverridden: d.isDuplicateOverridden ?? undefined,
    overrideAdminId: d.overrideAdminId ?? undefined,
    overrideAdminName: d.overrideAdminName ?? undefined,
    pixKey: d.pixKey ?? undefined,
    pixType: d.pixType ?? undefined,
    pixAccountHolder: d.pixAccountHolder ?? undefined,
    pixAccountHolderCpf: d.pixAccountHolderCpf ?? undefined,
    auditLog: (d.auditLog as unknown as DailyRecord['auditLog']) ?? [],
    reversalReason: d.reversalReason ?? undefined,
    reversalAt: d.reversalAt ?? undefined,
    revertedByName: d.revertedByName ?? undefined,
  })) as DailyRecord[];

  const workersMapped: Worker[] = workers.map((w) => ({
    ...w,
    avatar: w.avatar ?? undefined,
    birthDate: w.birthDate ?? undefined,
    managerId: w.managerId ?? undefined,
    managerName: w.managerName ?? undefined,
    voterRegistration: w.voterRegistration ?? undefined,
    voterZone: w.voterZone ?? undefined,
    voterSection: w.voterSection ?? undefined,
    voterCity: w.voterCity ?? undefined,
    voterState: w.voterState ?? undefined,
    voterDocumentPhoto: w.voterDocumentPhoto ?? undefined,
    pixType: w.pixType ?? undefined,
    pixKey: w.pixKey ?? undefined,
    pixAccountHolder: w.pixAccountHolder ?? undefined,
    pixAccountHolderCpf: w.pixAccountHolderCpf ?? undefined,
    bankName: w.bankName ?? undefined,
    bankAgency: w.bankAgency ?? undefined,
    bankAccount: w.bankAccount ?? undefined,
    bankAccountType: (w.bankAccountType as Worker['bankAccountType']) ?? undefined,
    approvalStatus: (w.approvalStatus as Worker['approvalStatus']) ?? undefined,
    approvalDate: w.approvalDate ?? undefined,
    approvedById: w.approvedById ?? undefined,
    approvedByName: w.approvedByName ?? undefined,
    approvalNotes: w.approvalNotes ?? undefined,
    rejectionReason: w.rejectionReason ?? undefined,
    registrationDate: w.registrationDate ?? undefined,
  })) as unknown as Worker[];

  const paymentBatches: PaymentBatch[] = paymentBatchesRaw.map((b) => ({
    ...b,
    notes: b.notes ?? undefined,
    dailyIds: (b.dailyIds as string[]) ?? [],
  }));

  const financialPayments: FinancialPayment[] = financialPaymentsRaw.map((p) => ({
    ...p,
    description: p.description ?? undefined,
    diariaIds: (p.diariaIds as string[] | null) ?? undefined,
    pixKey: p.pixKey ?? undefined,
    pixType: p.pixType ?? undefined,
    bankName: p.bankName ?? undefined,
    notes: p.notes ?? undefined,
    deliveredByName: p.deliveredByName ?? undefined,
    receivedBy: p.receivedBy ?? undefined,
    signedByWorker: p.signedByWorker ?? undefined,
    signedAt: p.signedAt ?? undefined,
    isReverted: p.isReverted ?? undefined,
    reversalReason: p.reversalReason ?? undefined,
    reversalAt: p.reversalAt ?? undefined,
    revertedByName: p.revertedByName ?? undefined,
  })) as FinancialPayment[];

  const paymentReversals: PaymentReversal[] = paymentReversalsRaw.map((r) => ({
    ...r,
    diariaIds: (r.diariaIds as string[]) ?? [],
    receiptNumber: r.receiptNumber ?? undefined,
    referencePeriod: r.referencePeriod ?? undefined,
  })) as PaymentReversal[];

  const absencesMapped: WorkerAbsence[] = absences.map((a) => ({
    ...a,
    recordedById: a.recordedById ?? undefined,
    recordedByName: a.recordedByName ?? undefined,
  }));

  return {
    users,
    workers: workersMapped,
    diarias,
    absences: absencesMapped,
    paymentBatches,
    financialPayments,
    paymentReversals,
  };
}

export async function getUserById(id: string) {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? mapUser(row) : null;
}
