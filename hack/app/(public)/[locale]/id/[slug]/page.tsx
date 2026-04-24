import type { Metadata } from 'next';
import {
  EventPersonProfilePage,
  generateEventPersonProfileMetadata,
} from '@/src/features/person-id/person-profile-page';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateEventPersonProfileMetadata({ eventSlug: locale, slug });
}

export default async function EventPersonPageRoute({ params }: PageProps) {
  const { locale, slug } = await params;
  return EventPersonProfilePage({ eventSlug: locale, slug });
}
