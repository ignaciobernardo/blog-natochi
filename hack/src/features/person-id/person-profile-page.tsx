import { Github, Linkedin } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getDefaultEvent, getEventBySlug } from '@/src/queries/events';
import {
  findPersonBySlugForEvent,
  type PersonLookupResult,
} from '@/src/queries/person-lookup';

interface EventPersonParams {
  eventSlug: string;
  slug: string;
}

interface DefaultPersonParams {
  slug: string;
}

interface LoadedPersonPageData {
  eventName: string;
  person: NonNullable<PersonLookupResult>;
}

function extractGithubUsername(github: string | null | undefined): string {
  if (!github) return '';
  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }
  return github;
}

function getGithubAvatarUrl(github: string | null | undefined): string | null {
  const username = extractGithubUsername(github);
  if (!username) return null;
  return `https://github.com/${username}.png`;
}

function getGithubUrl(github: string | null | undefined): string | null {
  if (!github) return null;
  if (github.startsWith('http')) return github;
  return `https://github.com/${github}`;
}

async function loadEventPersonPageData(
  eventSlug: string,
  slug: string,
): Promise<LoadedPersonPageData | null> {
  const event = await getEventBySlug(eventSlug);
  if (!event) {
    return null;
  }

  const person = await findPersonBySlugForEvent(event.id, slug);
  if (!person) {
    return null;
  }

  return {
    eventName: event.name,
    person,
  };
}

async function loadDefaultPersonPageData(
  slug: string,
): Promise<LoadedPersonPageData | null> {
  const event = await getDefaultEvent();
  if (!event) {
    return null;
  }

  const person = await findPersonBySlugForEvent(event.id, slug);
  if (!person) {
    return null;
  }

  return {
    eventName: event.name,
    person,
  };
}

export async function generateEventPersonProfileMetadata({
  eventSlug,
  slug,
}: EventPersonParams): Promise<Metadata> {
  const data = await loadEventPersonPageData(eventSlug, slug);

  if (!data) {
    return { title: 'Person Not Found' };
  }

  return {
    title: `${data.person.data.fullName} | ${data.eventName}`,
    description: `Profile for ${data.person.data.fullName}`,
  };
}

export async function generateDefaultPersonProfileMetadata({
  slug,
}: DefaultPersonParams): Promise<Metadata> {
  const data = await loadDefaultPersonPageData(slug);

  if (!data) {
    return { title: 'Person Not Found' };
  }

  return {
    title: `${data.person.data.fullName} | ${data.eventName}`,
    description: `Profile for ${data.person.data.fullName}`,
  };
}

export async function EventPersonProfilePage({
  eventSlug,
  slug,
}: EventPersonParams) {
  const data = await loadEventPersonPageData(eventSlug, slug);

  if (!data) {
    notFound();
  }

  if (data.person.type === 'external' && data.person.data.redirectUrl) {
    redirect(data.person.data.redirectUrl as any);
  }

  return <PersonProfilePage person={data.person} />;
}

export async function DefaultPersonProfilePage({ slug }: DefaultPersonParams) {
  const data = await loadDefaultPersonPageData(slug);

  if (!data) {
    notFound();
  }

  if (data.person.type === 'external' && data.person.data.redirectUrl) {
    redirect(data.person.data.redirectUrl as any);
  }

  return <PersonProfilePage person={data.person} />;
}

function PersonProfilePage({
  person,
}: {
  person: NonNullable<PersonLookupResult>;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-md">
          <PersonCard person={person} />
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person }: { person: NonNullable<PersonLookupResult> }) {
  const { type, data } = person;

  const githubUrl =
    type === 'hacker'
      ? getGithubUrl(data.github)
      : type === 'mentor'
        ? getGithubUrl(data.github)
        : data.githubUrl || null;

  const githubUsername =
    type === 'hacker'
      ? extractGithubUsername(data.github)
      : type === 'mentor'
        ? extractGithubUsername(data.github)
        : extractGithubUsername(data.githubUrl);

  const linkedinUrl =
    type === 'hacker'
      ? data.linkedin
      : type === 'mentor'
        ? data.linkedin
        : type === 'external'
          ? data.linkedinUrl
          : null;

  const avatarUrl =
    type === 'mentor' && data.pictureUrl
      ? data.pictureUrl
      : type === 'hacker'
        ? getGithubAvatarUrl(data.github)
        : type === 'mentor'
          ? getGithubAvatarUrl(data.github)
          : getGithubAvatarUrl(data.githubUrl);

  const title =
    type === 'hacker'
      ? 'HACKER'
      : type === 'mentor'
        ? 'MENTOR'
        : data.category.toUpperCase();

  const subtitle =
    type === 'mentor'
      ? data.companyTitle
      : type === 'external'
        ? data.role
        : null;

  return (
    <div className="border-2 border-primary bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 sm:p-8">
        {avatarUrl && (
          <div className="relative h-24 w-24 overflow-hidden border-2 border-primary sm:h-32 sm:w-32">
            <Image
              src={avatarUrl}
              alt={data.fullName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="text-center">
          <span className="inline-block bg-primary px-3 py-1 font-bold font-title text-background text-xs tracking-wider sm:text-sm">
            {title}
          </span>
        </div>

        <div className="text-center">
          <h1 className="font-bold font-title text-2xl text-primary sm:text-3xl">
            {data.fullName}
          </h1>
          {githubUsername && (
            <p className="mt-1 font-mono text-primary/70 text-sm sm:text-base">
              @{githubUsername}
            </p>
          )}
        </div>

        {subtitle && (
          <p className="text-center font-mono text-primary/70 text-sm">
            {subtitle}
          </p>
        )}
      </div>

      {(githubUrl || linkedinUrl) && (
        <div className="flex flex-col gap-3 border-primary/20 border-t p-6 sm:p-8">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 border-2 border-primary px-4 py-3 font-bold font-title text-primary text-sm transition-colors hover:bg-primary hover:text-background"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 border-2 border-primary px-4 py-3 font-bold font-title text-primary text-sm transition-colors hover:bg-primary hover:text-background"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}
