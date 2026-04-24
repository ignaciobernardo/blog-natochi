'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LinkedInPostCard from '../_components/linkedin-post-card';
import { linkedinPosts } from '../linkedin-posts';

export default function MediaPage() {
  const t = useTranslations('tourSponsor');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/${locale}/tour/sponsor`}
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <h1 className="mb-10 font-bold text-3xl md:text-4xl">
          {t('linkedin.title')}
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {linkedinPosts.map((post, i) => (
            <div
              key={post.url}
              style={{
                animation: `fadeInUp 0.5s ease both`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              <LinkedInPostCard
                post={post}
                viewOriginalLabel={t('linkedin.viewOriginal')}
                locale={locale}
                viewInEnglishLabel={
                  locale === 'en' ? t('linkedin.viewInEnglish') : undefined
                }
                viewInSpanishLabel={
                  locale === 'en' ? t('linkedin.viewInSpanish') : undefined
                }
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
