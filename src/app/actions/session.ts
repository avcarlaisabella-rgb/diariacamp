'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { mapUser } from '@/lib/data';
import type { User, UserRole } from '@/types';

export async function loginAction(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string; user?: User }> {
  if (!email || !password) {
    return { ok: false, error: 'Por favor, informe o e-mail e a senha.' };
  }

  const row = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!row || !row.active) {
    return { ok: false, error: 'E-mail ou senha inválidos. Tente novamente ou use os botões de acesso rápido.' };
  }

  const valid = await verifyPassword(password, row.passwordHash);
  if (!valid) {
    return { ok: false, error: 'E-mail ou senha inválidos. Tente novamente ou use os botões de acesso rápido.' };
  }

  await setSessionCookie(row.id);
  return { ok: true, user: mapUser(row) };
}

/**
 * Acesso rápido de demonstração: entra com o primeiro usuário ativo do papel informado,
 * sem exigir senha. Mantém o comportamento original do app (botões de demo na tela de login).
 */
export async function loginAsRoleAction(role: UserRole): Promise<{ ok: boolean; user?: User }> {
  const row = await prisma.user.findFirst({ where: { role, active: true }, orderBy: { createdAt: 'asc' } });
  if (!row) return { ok: false };
  await setSessionCookie(row.id);
  return { ok: true, user: mapUser(row) };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
