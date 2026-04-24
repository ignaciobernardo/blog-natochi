import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyTracksPage() {
  redirect((await getDefaultAdminPath('tracks')) as any);
}
