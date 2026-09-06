'use server';

// Espelham no Postgres as mutações financeiras já aplicadas otimisticamente
// no AppContext (ver comentário em actions/workers.ts).

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { FinancialPayment, PaymentReversal } from '@/types';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado.');
  return session;
}

export async function persistCreateFinancialPayment(payment: FinancialPayment): Promise<void> {
  await requireSession();
  await prisma.financialPayment.create({ data: payment as unknown as Record<string, unknown> as never });
}

export async function persistUpdateFinancialPayment(id: string, data: Partial<FinancialPayment>): Promise<void> {
  await requireSession();
  const { id: _ignore, ...rest } = data as FinancialPayment;
  await prisma.financialPayment.update({ where: { id }, data: rest as never }).catch(() => undefined);
}

export async function persistUpdateFinancialPaymentsMany(
  ids: string[],
  data: Partial<FinancialPayment>
): Promise<void> {
  await requireSession();
  if (ids.length === 0) return;
  await prisma.financialPayment.updateMany({ where: { id: { in: ids } }, data: data as never });
}

export async function persistCreatePaymentReversal(reversal: PaymentReversal): Promise<void> {
  await requireSession();
  await prisma.paymentReversal.create({ data: reversal as unknown as Record<string, unknown> as never });
}
