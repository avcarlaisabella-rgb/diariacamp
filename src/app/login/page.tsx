import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginScreen } from '@/components/auth/LoginScreen';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return <LoginScreen />;
}
