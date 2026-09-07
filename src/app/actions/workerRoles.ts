'use server';

// Espelham no Postgres as mutações de funções de trabalhador já aplicadas
// otimisticamente no AppContext (ver comentário em actions/workers.ts).

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { WorkerRoleType } from '@/types';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado.');
  return session;
}

export async function persistCreateWorkerRole(role: WorkerRoleType): Promise<void> {
  await requireSession();
  await prisma.workerRoleType.create({ data: role });
}

export async function persistDeleteWorkerRole(id: string): Promise<void> {
  await requireSession();
  await prisma.workerRoleType.delete({ where: { id } }).catch(() => undefined);
}
