import { Suspense } from 'react';
import { SubmitForm } from './_components/submit-form';

function SubmitFormSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-foreground/60">Loading...</p>
    </div>
  );
}

export default function ArcadeSubmitPage() {
  return (
    <Suspense fallback={<SubmitFormSkeleton />}>
      <SubmitForm />
    </Suspense>
  );
}
