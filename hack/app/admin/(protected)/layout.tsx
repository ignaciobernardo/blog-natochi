import { headers } from 'next/headers';
import { SidebarInset, SidebarProvider } from '@/src/components/ui/sidebar';
import { getDefaultAdminEvent } from '@/src/lib/admin/events';
import { auth } from '@/src/lib/auth';
import { onlyAdmin } from '@/src/lib/auth/server';
import { getAllEvents } from '@/src/queries/events';
import { AdminSidebar } from './_components/admin-sidebar';
import { ImpersonationBanner } from './_components/impersonation-banner';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await onlyAdmin();
  const [defaultEvent, allEvents] = await Promise.all([
    getDefaultAdminEvent(),
    getAllEvents(),
  ]);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <SidebarProvider>
      <AdminSidebar
        events={allEvents.map((event) => ({
          id: event.id,
          name: event.name,
          slug: event.slug,
        }))}
        user={user as any}
        defaultEventSlug={defaultEvent?.slug ?? null}
      />
      <SidebarInset>
        <ImpersonationBanner
          impersonatedBy={session?.session.impersonatedBy || null}
          userName={user.name}
          userEmail={user.email}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
