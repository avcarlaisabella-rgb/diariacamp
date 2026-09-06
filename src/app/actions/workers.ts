'use server';

// Estas actions espelham no Postgres as mutações que o AppContext já aplica
// otimisticamente no estado local do cliente. O cliente é quem decide o
// conteúdo (id, status calculado, etc.) — aqui apenas persistimos, exigindo
// somente que exista uma sessão válida (mesmo modelo de confiança do app
// original, que não tinha nenhum backend).

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { Worker } from '@/types';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado.');
  return session;
}

export async function persistCreateWorker(worker: Worker): Promise<void> {
  await requireSession();
  await prisma.worker.create({ data: worker as unknown as Record<string, unknown> as never });
}

export async function persistUpdateWorker(id: string, data: Partial<Worker>): Promise<void> {
  await requireSession();
  const { id: _ignore, ...rest } = data as Worker;
  await prisma.worker.update({ where: { id }, data: rest as never });
}

export async function persistDeleteWorker(id: string): Promise<void> {
  await requireSession();
  await prisma.worker.delete({ where: { id } }).catch(() => undefined);
}

export async function persistUpdateWorkersMany(ids: string[], data: Partial<Worker>): Promise<void> {
  await requireSession();
  if (ids.length === 0) return;
  await prisma.worker.updateMany({ where: { id: { in: ids } }, data: data as never });
}
