import * as Sentry from '@sentry/nextjs';
import { posthog } from 'posthog-js';
import type { Session } from '@/src/lib/auth';

function identifySentryUser(user: Session['user'] | null | undefined) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name || user.email,
    userType: user.userType,
  });
}

function identifyPostHogUser(user: Session['user'] | null | undefined) {
  if (!user) {
    posthog.reset();
    return;
  }

  posthog.identify(user.id, {
    email: user.email,
    userType: user.userType,
  });
}

function _identifyUser(user: Session['user'] | null | undefined) {
  identifySentryUser(user);
  identifyPostHogUser(user);
}
