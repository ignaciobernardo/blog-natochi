import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, type Session } from '@/src/lib/auth';

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session as Session | null;
}

export async function onlyAuthenticated(loginPath: string = '/login') {
  const session = await getSession();

  if (!session?.user) {
    redirect(loginPath as any);
  }

  return session;
}

export async function onlyAdmin() {
  const session = await getSession();

  if (session?.user?.userType !== 'admin') {
    redirect('/admin/login' as any);
  }
  return session.user;
}

export async function onlyAdminFull() {
  const user = await onlyAdmin();

  if (user.adminRole !== 'full') {
    redirect('/admin' as any);
  }

  return user;
}

export async function onlyHacker() {
  const session = await getSession();

  if (session?.user?.userType !== 'hacker') {
    redirect('/login' as any);
  }

  return session.user;
}
