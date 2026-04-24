import type { Metadata } from 'next';
import {
  DefaultPersonProfilePage,
  generateDefaultPersonProfileMetadata,
} from '@/src/features/person-id/person-profile-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateDefaultPersonProfileMetadata({ slug });
}

export default async function PersonPage({ params }: PageProps) {
  const { slug } = await params;
  return DefaultPersonProfilePage({ slug });
}
