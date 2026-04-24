import { redirect } from 'next/navigation';
import { getAdminEventPath } from '@/src/lib/admin/routes';

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminEventPage({ params }: PageProps) {
  const { eventSlug } = await params;
  redirect(getAdminEventPath(eventSlug, 'dashboard') as any);
}
