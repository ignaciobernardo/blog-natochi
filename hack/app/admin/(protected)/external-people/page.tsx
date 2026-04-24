import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyExternalPeoplePage() {
  redirect((await getDefaultAdminPath('external-people')) as any);
}
