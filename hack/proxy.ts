import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const locales = ['es', 'en'] as const;
const defaultLocale = 'es' as const;

const MARKDOWN_ALTERNATES: Record<string, string> = {
  '/': '/index.md',
  '/26-ar': '/26-ar.md',
};

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept.split(',').map((part) => {
    const [type, ...params] = part.trim().split(';');
    const qParam = params.find((p) => p.trim().startsWith('q='));
    const q = qParam ? Number.parseFloat(qParam.split('=')[1]) : 1;
    return { type: type.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
  });

  let mdQ = 0;
  let htmlQ = 0;
  for (const { type, q } of parts) {
    if (type === 'text/markdown') mdQ = Math.max(mdQ, q);
    else if (type === 'text/html') htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

// Create the i18n middleware
const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Don't add prefix for default locale
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const mdPath = MARKDOWN_ALTERNATES[pathname];
  if (mdPath) {
    if (prefersMarkdown(request.headers.get('accept'))) {
      const url = request.nextUrl.clone();
      url.pathname = mdPath;
      const rewritten = NextResponse.rewrite(url);
      rewritten.headers.append('Vary', 'Accept');
      rewritten.headers.set('x-pathname', pathname);
      return rewritten;
    }

    const response = NextResponse.next();
    response.headers.append(
      'Link',
      `<${mdPath}>; rel="alternate"; type="text/markdown"`,
    );
    response.headers.append('Vary', 'Accept');
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // Skip i18n handling for API routes and static files
  if (!pathname.startsWith('/es') && !pathname.startsWith('/en')) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // Apply i18n middleware for all other routes
  const response = i18nMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - api routes
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - public files (images, etc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
