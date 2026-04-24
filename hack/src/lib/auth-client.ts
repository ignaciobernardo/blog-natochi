import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { resolveUrl } from '@/src/lib/utils/url';

function getAuthBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return resolveUrl();
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
