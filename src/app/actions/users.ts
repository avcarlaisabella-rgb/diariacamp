'use server';

// Espelham no Postgres as mutações de usuários já aplicadas otimisticamente
// no AppContext (ver comentário em actions/workers.ts). Login/verificação de
// senha real ficam em actions/session.ts.

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import type { User } from '@/types';

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado.');
  return session;
}

export async function persistUpdateProfile(
  userId: string,
  data: { name: string; email: string; avatar: string; password?: string }
): Promise<void> {
  await requireSession();
  const passwordHash = data.password ? await hashPassword(data.password) : undefined;
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      avatar: data.avatar,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });
}

export async function persistCreateUser(user: User & { password?: string }): Promise<void> {
  await requireSession();
  const passwordHash = await hashPassword(user.password?.trim() || '123');
  await prisma.user.create({
    data: {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      passwordHash,
      role: user.role,
      avatar: user.avatar || '',
      teamZone: user.teamZone,
      phone: user.phone,
      active: user.active,
      managerId: user.managerId,
      managerName: user.managerName,
    },
  });
}

export async function persistUpdateUser(id: string, data: Partial<User>): Promise<void> {
  await requireSession();
  const { id: _ignore, password, ...rest } = data as Partial<User> & { password?: string };
  const updateData: Record<string, unknown> = { ...rest };
  if (rest.email) updateData.email = rest.email.toLowerCase().trim();
  if (password && password.trim()) {
    updateData.passwordHash = await hashPassword(password.trim());
  }
  await prisma.user.update({
    where: { id },
    data: updateData as never,
  });
}

export async function persistResetPassword(id: string, newPassword?: string): Promise<void> {
  await requireSession();
  const passwordHash = await hashPassword(newPassword?.trim() || '123');
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function canDeleteUserAction(id: string): Promise<{ canDelete: boolean; reason?: string }> {
  await requireSession();
  const [hasDiarias, hasWorkers] = await Promise.all([
    prisma.dailyRecord.findFirst({
      where: {
        OR: [{ coordinatorId: id }, { managerId: id }, { createdById: id }, { approvedById: id }, { paidById: id }],
      },
    }),
    prisma.worker.findFirst({ where: { OR: [{ coordinatorId: id }, { managerId: id }] } }),
  ]);

  if (hasDiarias || hasWorkers) {
    return {
      canDelete: false,
      reason:
        'Este usuário possui histórico vinculado na campanha (diárias registradas, aprovadas ou trabalhadores sob sua gestão). Para manter a integridade jurídica e a auditoria das contas de campanha, você deve apenas desativar o acesso.',
    };
  }
  return { canDelete: true };
}
