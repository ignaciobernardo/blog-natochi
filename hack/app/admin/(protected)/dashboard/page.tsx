import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyDashboardPage() {
  redirect((await getDefaultAdminPath('dashboard')) as any);
}
