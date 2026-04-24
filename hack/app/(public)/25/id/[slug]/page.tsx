import type { Metadata } from 'next';
import {
  EventPersonProfilePage,
  generateEventPersonProfileMetadata,
} from '@/src/features/person-id/person-profile-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateEventPersonProfileMetadata({ eventSlug: '25', slug });
}

export default async function Event25PersonPageRoute({ params }: PageProps) {
  const { slug } = await params;
  return EventPersonProfilePage({ eventSlug: '25', slug });
}
