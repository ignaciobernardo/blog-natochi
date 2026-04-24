import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { getHackerById } from '@/src/queries/hackers';
import { GithubSuccessView } from './_components/github-success-view';

export default async function GithubSuccessPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const hacker = await getHackerById(session.user.linkedId);

  if (!hacker) {
    redirect('/login?error=hacker_not_found');
  }

  return <GithubSuccessView hacker={hacker} user={session.user} />;
}
