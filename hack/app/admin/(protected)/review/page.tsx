import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyReviewPage() {
  redirect((await getDefaultAdminPath('review')) as any);
}
