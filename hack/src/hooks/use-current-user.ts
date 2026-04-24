'use client';

import { useSession } from '@/src/lib/auth-client';

function _useCurrentUser() {
  const { data: session } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: !session,
  };
}
