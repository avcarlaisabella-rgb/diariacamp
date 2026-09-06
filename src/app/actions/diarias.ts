'use server';

// Espelham no Postgres as mutações de diárias/faltas já aplicadas
// otimisticamente no AppContext (ver comentário em actions/workers.ts).

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { DailyRecord, WorkerAbsence } from '@/types';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado.');
  return session;
}

export async function persistCreateDiaria(record: DailyRecord): Promise<void> {
  await requireSession();
  await prisma.dailyRecord.create({ data: record as unknown as Record<string, unknown> as never });
}

export async function persistCreateDiariasBatch(records: DailyRecord[]): Promise<void> {
  await requireSession();
  if (records.length === 0) return;
  await prisma.dailyRecord.createMany({ data: records as unknown as Record<string, unknown>[] as never });
}

export async function persistUpdateDiaria(id: string, data: Partial<DailyRecord>): Promise<void> {
  await requireSession();
  const { id: _ignore, ...rest } = data as DailyRecord;
  await prisma.dailyRecord.update({ where: { id }, data: rest as never });
}

export async function persistUpdateDiariasMany(ids: string[], data: Partial<DailyRecord>): Promise<void> {
  await requireSession();
  if (ids.length === 0) return;
  await prisma.dailyRecord.updateMany({ where: { id: { in: ids } }, data: data as never });
}

export async function persistDeleteDiaria(id: string): Promise<void> {
  await requireSession();
  await prisma.dailyRecord.delete({ where: { id } }).catch(() => undefined);
}

export async function persistUpsertAbsence(absence: WorkerAbsence): Promise<void> {
  await requireSession();
  await prisma.workerAbsence.upsert({
    where: { id: absence.id },
    update: absence as never,
    create: absence as unknown as Record<string, unknown> as never,
  });
}

export async function persistRemoveAbsence(workerId: string, date: string): Promise<void> {
  await requireSession();
  await prisma.workerAbsence.deleteMany({ where: { workerId, date } });
}

export async function persistCreatePaymentBatch(batch: {
  id: string;
  batchNumber: string;
  date: string;
  totalAmount: number;
  totalPeople: number;
  pixCount: number;
  pixAmount: number;
  cashCount: number;
  cashAmount: number;
  dailyIds: string[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}): Promise<void> {
  await requireSession();
  await prisma.paymentBatch.create({ data: batch as unknown as Record<string, unknown> as never });
}
