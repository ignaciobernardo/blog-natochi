import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function LegacyProjectsPage() {
  redirect((await getDefaultAdminPath('projects')) as any);
}
