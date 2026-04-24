import { redirect } from 'next/navigation';
import { getDefaultAdminPath } from '@/src/lib/admin/events';

export default async function AdminPage() {
  redirect((await getDefaultAdminPath()) as any);
}
