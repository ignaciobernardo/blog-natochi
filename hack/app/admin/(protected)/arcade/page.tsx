import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyArcadePage() {
  redirect((await getDefaultAdminPath('arcade')) as any);
}
