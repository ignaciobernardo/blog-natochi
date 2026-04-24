'use client';

import {
  Calendar,
  CalendarClock,
  Clock,
  DoorOpen,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  Mail,
  Shield,
  Target,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { SidebarUserNav } from '@/src/components/sidebar-user-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/src/components/ui/sidebar';
import {
  ADMIN_EVENT_ROUTE_SEGMENTS,
  type AdminEventRouteSegment,
  getAdminEventPath,
  getAdminGeneralPath,
} from '@/src/lib/admin/routes';
import type { Session } from '@/src/lib/auth';
import type { Event } from '@/src/lib/db/schema';

type AdminSidebarEvent = Pick<Event, 'id' | 'name' | 'slug'>;

interface AdminSidebarProps {
  events: AdminSidebarEvent[];
  user: Session['user'];
  defaultEventSlug: string | null;
}

const eventMenuItems: Array<{
  title: string;
  segment: AdminEventRouteSegment;
  icon: typeof LayoutDashboard;
  fullAccessOnly?: boolean;
}> = [
  {
    title: 'Dashboard',
    segment: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Review',
    segment: 'review',
    icon: Users,
  },
  {
    title: 'Entrance',
    segment: 'entrance',
    icon: DoorOpen,
  },
  {
    title: 'Teams',
    segment: 'teams',
    icon: UsersRound,
    fullAccessOnly: true,
  },
  {
    title: 'Projects',
    segment: 'projects',
    icon: FolderKanban,
  },
  {
    title: 'Tracks',
    segment: 'tracks',
    icon: Target,
    fullAccessOnly: true,
  },
  {
    title: 'Mentors',
    segment: 'mentors',
    icon: UserCheck,
    fullAccessOnly: true,
  },
  {
    title: 'External People',
    segment: 'external-people',
    icon: UserPlus,
    fullAccessOnly: true,
  },
  {
    title: 'Arcade Games',
    segment: 'arcade',
    icon: Gamepad2,
  },
  {
    title: 'Time Slots',
    segment: 'time-slots',
    icon: CalendarClock,
    fullAccessOnly: true,
  },
];

const generalMenuItems = [
  {
    title: 'Events',
    href: getAdminGeneralPath('events'),
    icon: Calendar,
    fullAccessOnly: true,
  },
  {
    title: 'Arcade Challenges',
    href: getAdminGeneralPath('arcade-challenges'),
    icon: Gamepad2,
    fullAccessOnly: true,
  },
  {
    title: 'Emails',
    href: getAdminGeneralPath('emails'),
    icon: Mail,
  },
  {
    title: 'Cron Jobs',
    href: getAdminGeneralPath('cron'),
    icon: Clock,
    fullAccessOnly: true,
  },
  {
    title: 'Users',
    href: getAdminGeneralPath('users'),
    icon: Shield,
    fullAccessOnly: true,
  },
];

function isActivePath(pathname: string | null, href: string) {
  return pathname === href || pathname?.startsWith(`${href}/`);
}

function EventSwitcher({
  activeEventSlug,
  events,
}: {
  activeEventSlug: string;
  events: AdminSidebarEvent[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEventChange = (eventSlug: string) => {
    const pathSegments = pathname?.split('/').filter(Boolean) ?? [];
    const currentSegment = pathSegments[2];
    const targetSegment = ADMIN_EVENT_ROUTE_SEGMENTS.includes(
      currentSegment as AdminEventRouteSegment,
    )
      ? currentSegment
      : 'dashboard';
    const targetPath = getAdminEventPath(eventSlug, targetSegment);
    const isEventListPage = pathSegments.length === 3;
    const queryString = isEventListPage ? searchParams.toString() : '';

    router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
  };

  return (
    <Select value={activeEventSlug} onValueChange={handleEventChange}>
      <SelectTrigger className="h-8 w-full text-xs">
        <SelectValue placeholder="Select event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.slug}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AdminSidebarContent({
  events,
  user,
  defaultEventSlug,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const params = useParams<{ eventSlug?: string }>();
  const { state } = useSidebar();
  const isFullAccess = user.adminRole === 'full';
  const activeEventSlug =
    params.eventSlug ?? defaultEventSlug ?? events[0]?.slug ?? null;

  const visibleEventMenuItems = activeEventSlug
    ? eventMenuItems
        .filter((item) => !item.fullAccessOnly || isFullAccess)
        .map((item) => ({
          ...item,
          href: getAdminEventPath(activeEventSlug, item.segment),
        }))
    : [];
  const visibleGeneralMenuItems = generalMenuItems.filter(
    (item) => !item.fullAccessOnly || isFullAccess,
  );

  return (
    <>
      <SidebarHeader>
        <div className="flex items-start justify-between gap-2 px-2 py-2">
          {state === 'expanded' ? (
            <>
              <div className="flex flex-1 flex-col gap-2 px-2">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-semibold text-lg">Platanus Hack Admin</h2>
                  <p className="text-muted-foreground text-xs">Admin Panel</p>
                </div>
                {activeEventSlug && events.length > 0 && (
                  <EventSwitcher
                    activeEventSlug={activeEventSlug}
                    events={events}
                  />
                )}
              </div>
              <SidebarTrigger />
            </>
          ) : (
            <SidebarTrigger />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleEventMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Event</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleEventMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActivePath(pathname, item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href as any}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleGeneralMenuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href as any}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserNav user={user} />
      </SidebarFooter>
    </>
  );
}

export function AdminSidebar({
  events,
  user,
  defaultEventSlug,
}: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <AdminSidebarContent
        events={events}
        user={user}
        defaultEventSlug={defaultEventSlug}
      />
    </Sidebar>
  );
}
