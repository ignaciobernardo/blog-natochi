import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyEntrancePage() {
  redirect((await getDefaultAdminPath('entrance')) as any);
}
