import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyMentorsPage() {
  redirect((await getDefaultAdminPath('mentors')) as any);
}
