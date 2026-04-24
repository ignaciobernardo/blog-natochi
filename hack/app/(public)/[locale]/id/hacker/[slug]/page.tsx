import type { Route } from 'next';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function EventHackerRedirectPage({ params }: PageProps) {
  const { locale, slug } = await params;
  redirect(`/${locale}/id/${slug}` as Route);
}
