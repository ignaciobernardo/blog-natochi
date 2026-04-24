'use client';

import {
  Calendar,
  Gift,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Target,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import type { Session } from '@/src/lib/auth';
import { authClient } from '@/src/lib/auth-client';
import type { Hacker } from '@/src/lib/db/schema';
import { cn } from '@/src/lib/utils';

interface HackerSidebarProps {
  user?: Session['user'];
  hacker?: Hacker;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const navigation: Array<{
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external: boolean;
}> = [
  {
    name: 'Dashboard',
    href: '/hacker/dashboard',
    icon: Home,
    external: false,
  },
  {
    name: 'Cronograma',
    href: '/hacker/schedule',
    icon: Calendar,
    external: false,
  },
  {
    name: 'Selección de Tracks',
    href: '/hacker/track-selection',
    icon: Target,
    external: false,
  },
  {
    name: 'Selección de Mentores',
    href: '/hacker/mentor-selection',
    icon: GraduationCap,
    external: false,
  },
  {
    name: 'Sponsor Credits',
    href: '/hacker/credits',
    icon: Gift,
    external: false,
  },
  {
    name: 'Discord',
    href: 'https://platan.us/hack/discord',
    icon: DiscordIcon,
    external: true,
  },
  {
    name: 'FAQ',
    href: 'https://discord.com/channels/1439366811979223345/1439370735658471566',
    icon: HelpCircle,
    external: true,
  },
];

export function HackerSidebar({ user, hacker }: HackerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Extract GitHub username from GitHub URL
  const githubUsername = hacker?.github
    ? hacker.github.split('/').pop() || 'Usuario'
    : user?.name || 'Usuario';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-primary border-r-2 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center border-primary border-b-2 px-4">
        <div
          className="aspect-[576/112] h-6 w-auto"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            maskImage: 'url(/assets/logos/platanus.svg)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            !item.external &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const className = cn(
            'flex items-center gap-3 border-2 px-3 py-2 font-mono text-sm transition-all',
            isActive
              ? 'border-primary bg-primary text-background'
              : 'border-transparent text-primary hover:border-primary hover:bg-primary/10',
          );

          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </a>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href as '/hacker/dashboard'}
              className={className}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-primary border-t-2 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-2 border-primary/20 bg-primary/5 px-3 py-2">
            <User className="h-4 w-4 text-primary" />
            <span className="truncate font-mono text-primary text-sm">
              @{githubUsername}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full border-2 border-primary font-mono text-primary hover:bg-primary hover:text-background"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </div>
  );
}
