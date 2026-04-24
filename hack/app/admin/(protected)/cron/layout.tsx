import type { ReactNode } from 'react';
import { onlyAdminFull } from '@/src/lib/auth/server';

export default async function CronLayout({
  children,
}: {
  children: ReactNode;
}) {
  await onlyAdminFull();

  return <>{children}</>;
}
