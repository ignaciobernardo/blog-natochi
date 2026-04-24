import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyTimeSlotsPage() {
  redirect((await getDefaultAdminPath('time-slots')) as any);
}
