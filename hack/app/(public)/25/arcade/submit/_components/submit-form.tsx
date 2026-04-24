'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ArcadeScreen } from '../../_components/arcade-screen';
import { validateGameSubmission } from '../_actions/validate-submission.action';

export function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repoUrl, setRepoUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message?: string;
    gameId?: string;
    redirectTo?: string;
    restrictions?: {
      passed: boolean;
      results: Array<{
        name: string;
        passed: boolean;
        message: string;
        details?: string;
      }>;
      sizeKB: number;
      minifiedSize: number;
      originalSizeKB: number;
    };
  } | null>(null);

  useEffect(() => {
    const repoFromQuery = searchParams.get('repo');
    if (repoFromQuery) {
      setRepoUrl(repoFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkExpired = () => {
      const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkExpired();
    const timer = setInterval(checkExpired, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateGameSubmission(repoUrl);

      // Redirect immediately if there's a redirect URL
      if (result.redirectTo) {
        router.push(result.redirectTo as `/25/arcade/submit/review/${string}`);
        return;
      }

      // Otherwise show the validation result
      setValidationResult(result);
    } catch (_error) {
      setValidationResult({
        success: false,
        message: 'failed to validate submission',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <ArcadeScreen intensity="medium">
      <div className="flex flex-col gap-6 font-mono">
        <div className="flex flex-col gap-2 text-center">
          <Link
            href="/25/arcade"
            className="flex cursor-pointer flex-col gap-1 transition-opacity hover:opacity-80"
          >
            <h1
              className="font-bold font-logo text-4xl text-foreground/90 uppercase tracking-wider md:text-5xl"
              style={{ fontFamily: 'var(--font-logo)' }}
            >
              Platanus Hack 25
            </h1>
            <h2
              className="crt-glow font-bold font-logo text-3xl text-primary uppercase tracking-wider md:text-4xl"
              style={{ fontFamily: 'var(--font-logo)' }}
            >
              Submit Game
            </h2>
          </Link>
          <div className="h-4" />
        </div>

        <div className="rounded-lg border-4 border-primary bg-black/50 p-8 shadow-[0_0_30px_rgba(255,214,0,0.3)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="repo-url"
                className="crt-glow font-bold text-lg text-primary"
              >
                REPOSITORY URL
              </label>
              <Input
                id="repo-url"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                disabled={isValidating}
                className="border-primary bg-black/70 font-mono text-foreground"
              />
              <p className="text-foreground/60 text-sm">
                enter your github repository url containing metadata.json and
                game.js
              </p>
            </div>

            {validationResult && (
              <div className="flex flex-col gap-4">
                <div
                  className={`rounded border-2 p-4 ${
                    validationResult.success
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-red-500 bg-red-500/10'
                  }`}
                >
                  <p
                    className={`font-mono ${
                      validationResult.success
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {validationResult.message}
                  </p>
                  {validationResult.gameId && (
                    <p className="mt-2 text-foreground/60 text-sm">
                      game id: {validationResult.gameId}
                    </p>
                  )}
                </div>

                {validationResult.restrictions && (
                  <div className="flex flex-col gap-2">
                    <p className="font-bold text-primary text-sm uppercase">
                      validation results
                    </p>
                    {validationResult.restrictions.results.map((result) => (
                      <div
                        key={result.name}
                        className="flex items-start gap-2 rounded border border-foreground/20 bg-black/30 p-3"
                      >
                        <span
                          className={`text-lg ${
                            result.passed ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {result.passed ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold font-mono text-sm">
                            {result.name}
                          </p>
                          <p className="font-mono text-foreground/70 text-xs">
                            {result.message}
                          </p>
                          {result.details && (
                            <p className="mt-1 font-mono text-foreground/50 text-xs">
                              {result.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isExpired && (
              <div className="rounded border-2 border-red-500 bg-red-500/10 p-4">
                <p className="font-mono text-red-400">
                  submission deadline has passed
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={isValidating || !repoUrl.trim() || isExpired}
              className="bg-primary px-6 py-2 font-bold text-black text-sm uppercase tracking-wider hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-foreground/40"
            >
              {isValidating ? 'validating...' : '>> submit game <<'}
            </Button>
          </form>
        </div>
      </div>
    </ArcadeScreen>
  );
}
