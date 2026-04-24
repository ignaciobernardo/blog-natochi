import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyTeamsPage() {
  redirect((await getDefaultAdminPath('teams')) as any);
}
