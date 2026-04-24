import { isProductionEnvironment } from '@/src/lib/constants';

function _generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function resolveUrl(path: string = ''): string {
  const baseUrl = isProductionEnvironment
    ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    : 'http://localhost:3000';

  if (!path) return baseUrl;

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
