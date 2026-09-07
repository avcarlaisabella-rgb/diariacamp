import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'diariacamp_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET não configurado no ambiente.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  [key: string]: unknown;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== 'string') return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Detecta se a requisição atual chegou via HTTPS, olhando o header
 * `x-forwarded-proto` (setado pelo proxy reverso do Coolify/Traefik) já que,
 * atrás do proxy, o Next.js só enxerga a conexão interna em HTTP puro.
 * Sem esse header (ex.: `next dev` local), cai no protocolo da própria requisição.
 */
async function isRequestSecure(): Promise<boolean> {
  const headerList = await headers();
  const forwardedProto = headerList.get('x-forwarded-proto');
  if (forwardedProto) return forwardedProto.split(',')[0].trim() === 'https';
  return false;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSessionToken({ userId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: await isRequestSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Lê e valida a sessão atual a partir do cookie (uso em Server Components / Server Actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
