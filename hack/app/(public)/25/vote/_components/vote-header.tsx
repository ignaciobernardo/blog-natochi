'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import type { Session } from '@/src/lib/auth';
import { signIn, signOut } from '@/src/lib/auth-client';

interface VoteHeaderProps {
  session: Session | null;
  hasGoogleAccount: boolean;
}

export function VoteHeader({ session, hasGoogleAccount }: VoteHeaderProps) {
  const router = useRouter();

  const handleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/25/vote',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <div className="border-primary/20 border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/25/vote">
          <h1 className="flex items-center gap-2 bg-primary px-2 py-1 text-2xl transition-opacity hover:opacity-80 sm:gap-3 sm:px-3 sm:text-5xl md:text-6xl">
            <span className="font-logo text-background lowercase tracking-tighter">
              <span className="font-light">platanus hack</span>{' '}
              <span className="font-medium">[25]</span>
            </span>
            <span className="text-background">|</span>
            <span className="font-bold font-logo text-background lowercase tracking-tighter">
              voting
            </span>
          </h1>
        </Link>

        {/* Login/Profile Section */}
        <div className="flex items-center">
          {hasGoogleAccount && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-3 rounded-md transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-primary"
                    />
                  )}
                  <span className="hidden font-title text-primary sm:block">
                    {session.user.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-primary/20 bg-background"
              >
                <div className="px-2 py-1.5">
                  <p className="font-title text-primary text-sm">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-primary/20" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer font-title text-primary focus:bg-primary/5 focus:text-primary"
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="border-2 border-primary bg-transparent px-4 py-2 font-bold font-title text-primary transition-all hover:bg-primary hover:text-background sm:px-6 sm:py-3"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
