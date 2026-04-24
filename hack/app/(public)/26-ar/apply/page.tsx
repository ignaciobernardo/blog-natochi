import { notFound } from 'next/navigation';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import { ApplyPageClient } from './_components/apply-page-client';
import { getHack26BuenosAiresEvent } from './_lib/event';

interface ApplyPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const event = await getHack26BuenosAiresEvent();
  const { q } = await searchParams;
  const prefillQuery = isDevelopmentEnvironment
    ? Array.isArray(q)
      ? q[0]
      : (q ?? null)
    : null;

  if (!event) {
    notFound();
  }

  return (
    <ApplyPageClient
      eventName={event.name}
      finalDeadlineAtIso={event.finalDeadlineAt?.toISOString() ?? null}
      prefillQuery={prefillQuery}
    />
  );
}
