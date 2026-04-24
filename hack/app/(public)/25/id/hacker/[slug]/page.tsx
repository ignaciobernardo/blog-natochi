import type { Route } from 'next';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HackerRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/25/id/${slug}` as Route);
}
