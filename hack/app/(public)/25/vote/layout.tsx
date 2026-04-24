import { getSession } from '@/src/lib/auth/server';
import { hasGoogleAccount } from '@/src/queries/users';
import { VoteFooter } from './_components/vote-footer';
import { VoteHeader } from './_components/vote-header';

export default async function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const hasGoogle = session?.user
    ? await hasGoogleAccount(session.user.id)
    : false;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <VoteHeader session={session} hasGoogleAccount={hasGoogle} />
      <div className="flex-1">{children}</div>
      <VoteFooter />
    </div>
  );
}
