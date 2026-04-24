import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { AdditionalInfoForm } from './_components/additional-info-form';

export default async function AdditionalInfoPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  return <AdditionalInfoForm />;
}
