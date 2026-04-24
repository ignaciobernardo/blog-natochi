import type { Metadata } from 'next';

export function generateAdminMetadata(section: string): Metadata {
  return {
    title: `Platanus Hack 25 Admin | ${section}`,
  };
}
