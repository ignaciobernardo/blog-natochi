'use client';

import type { Session } from '@/src/lib/auth';
import { useSession } from '@/src/lib/auth-client';
import type { UserType } from '@/src/lib/db/schema';

function _useAuthorization() {
  const { data: session, isPending, error } = useSession();
  const user = session?.user as Session['user'] | undefined;

  return {
    user,
    userType: user?.userType,
    status: isPending
      ? 'loading'
      : session
        ? 'authenticated'
        : 'unauthenticated',
    isLoading: isPending,
    error,
    isAdmin: user?.userType === 'admin',
    isHacker: user?.userType === 'hacker',
    hasUserType: (userType: UserType) => user?.userType === userType,
  };
}
