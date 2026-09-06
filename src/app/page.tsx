import { redirect } from 'next/navigation';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { getBootstrapData, getUserById } from '@/lib/data';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await getUserById(session.userId);
  if (!user) {
    // Cookie válido mas usuário não existe mais (removido do banco): força novo login.
    await clearSessionCookie();
    redirect('/login');
  }

  const bootstrapData = await getBootstrapData();

  return (
    <AppProvider initialUser={user} initialData={bootstrapData}>
      <AppShell />
    </AppProvider>
  );
}
