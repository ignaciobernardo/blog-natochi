import { Github, Globe, Linkedin } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { YouTubePlayer } from '@/src/components/youtube-player';
import { getSession } from '@/src/lib/auth/server';
import { extractYouTubeId } from '@/src/lib/utils/youtube';
import { getProjectBySlug } from '@/src/queries/projects';
import { hasGoogleAccount } from '@/src/queries/users';
import { getUserVoteCount } from '@/src/queries/votes';
import { OnelinerText } from './_components/oneliner-text';
import { UpvoteButton } from './_components/upvote-button';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSession();
  const project = await getProjectBySlug(slug, session?.user?.id);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const titleOneliner = project.onelinerShort || project.oneliner || '';
  const title = `Platanus Hack 25 | ${project.name}${titleOneliner ? ` | ${titleOneliner}` : ''}`;
  const descriptionText =
    project.onelinerShort ||
    project.description?.slice(0, 150) ||
    project.oneliner ||
    '';
  const description = `Vota por el proyecto ${project.name}${descriptionText ? `, ${descriptionText}` : ''}`;
  const ogImageUrl = `${baseUrl}/assets/images/hack-25/projects-og/${project.teamSlug}.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
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

const DEFAULT_LOGO_HASH = process.env.DEFAULT_LOGO_HASH || '';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function isDefaultLogo(logoHash: string | null): boolean {
  if (!logoHash || !DEFAULT_LOGO_HASH) return false;
  return logoHash.toLowerCase() === DEFAULT_LOGO_HASH.toLowerCase();
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const session = await getSession();
  const project = await getProjectBySlug(slug, session?.user?.id);

  if (!project || !project.videoUrl) {
    notFound();
  }

  if (project.videoStartAt == null) {
    redirect('/25/vote');
  }

  const videoId = extractYouTubeId(project.videoUrl);

  // Check if user has a Google account
  const userHasGoogleAccount = session?.user
    ? await hasGoogleAccount(session.user.id)
    : false;

  // Get user's vote count to check if below threshold
  const userVoteCount = session?.user
    ? await getUserVoteCount(session.user.id)
    : 0;

  const MAX_VOTES_PER_USER =
    Number.parseInt(process.env.MAX_VOTES_PER_USER || '0', 10) || 0;
  const isBelowThreshold =
    MAX_VOTES_PER_USER === 0 || userVoteCount < MAX_VOTES_PER_USER;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="space-y-6">
        {/* Project Header - Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Logo and Title Row */}
          <div className="flex items-center gap-4">
            {project.logoUrl && !isDefaultLogo(project.logoHash) ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-primary/5">
                <Image
                  src={project.logoUrl}
                  alt={project.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-primary/20 bg-primary/10">
                <span className="font-bold font-title text-2xl text-primary">
                  {getInitials(project.name)}
                </span>
              </div>
            )}
            <h1 className="flex-1 font-bold font-title text-2xl text-primary">
              {project.name}
            </h1>
          </div>

          {/* Oneliner and Track */}
          <div className="flex flex-col gap-2">
            {project.oneliner && (
              <OnelinerText
                text={project.oneliner}
                projectName={project.name}
                projectLogoUrl={project.logoUrl}
                projectTrackName={project.trackName}
                isDefaultLogo={isDefaultLogo(project.logoHash)}
              />
            )}
            {project.trackName && (
              <span className="inline-block w-fit bg-primary/10 px-3 py-1 font-title text-primary text-sm">
                {project.trackName}
              </span>
            )}
          </div>

          {/* Upvote Button */}
          <UpvoteButton
            projectId={project.id}
            projectSlug={project.slug}
            projectName={project.name}
            initialVoted={project.hasVoted}
            initialCount={project.voteCount}
            isAuthenticated={!!session?.user}
            hasGoogleAccount={userHasGoogleAccount}
            isBelowThreshold={isBelowThreshold}
          />
        </div>

        {/* Project Header - Desktop Layout */}
        <div className="hidden items-center gap-4 sm:flex">
          {project.logoUrl && !isDefaultLogo(project.logoHash) ? (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-primary/5 lg:h-24 lg:w-24">
              <Image
                src={project.logoUrl}
                alt={project.name}
                width={96}
                height={96}
                className="h-full w-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-primary/20 bg-primary/10 lg:h-24 lg:w-24">
              <span className="font-bold font-title text-3xl text-primary lg:text-4xl">
                {getInitials(project.name)}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <h1 className="font-bold font-title text-3xl text-primary sm:text-4xl">
              {project.name}
            </h1>
            {project.oneliner && (
              <OnelinerText
                text={project.oneliner}
                projectName={project.name}
                projectLogoUrl={project.logoUrl}
                projectTrackName={project.trackName}
                isDefaultLogo={isDefaultLogo(project.logoHash)}
              />
            )}
            {project.trackName && (
              <span className="inline-block w-fit bg-primary/10 px-3 py-1 font-title text-primary text-sm">
                {project.trackName}
              </span>
            )}
          </div>
          <div className="shrink-0">
            <UpvoteButton
              projectId={project.id}
              projectSlug={project.slug}
              projectName={project.name}
              initialVoted={project.hasVoted}
              initialCount={project.voteCount}
              isAuthenticated={!!session?.user}
              hasGoogleAccount={userHasGoogleAccount}
              isBelowThreshold={isBelowThreshold}
            />
          </div>
        </div>

        {/* Video Player */}
        {videoId && (
          <YouTubePlayer
            videoId={videoId}
            startAt={project.videoStartAt}
            endAt={project.videoEndAt}
          />
        )}

        {/* Action Buttons and Team Members */}
        <div className="flex flex-col items-center gap-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-primary/30 bg-transparent px-4 py-2 font-title text-primary transition-all hover:border-primary hover:bg-primary hover:text-background"
              >
                <Github className="h-4 w-4" />
                ver código
              </a>
            )}
            {project.deployUrl && (
              <a
                href={project.deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-primary/30 bg-transparent px-4 py-2 font-title text-primary transition-all hover:border-primary hover:bg-primary hover:text-background"
              >
                <Globe className="h-4 w-4" />
                ver aplicación
              </a>
            )}
          </div>

          {/* Team Members */}
          {project.members.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {project.members.map((member) => {
                const avatarUrl = getGithubAvatarUrl(member.github);
                return (
                  <div key={member.id} className="group relative h-24 w-24">
                    {avatarUrl ? (
                      <>
                        <Image
                          src={avatarUrl}
                          alt={member.fullName}
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-full border-2 border-primary/20 object-cover transition-all group-hover:border-primary"
                        />
                        {/* Overlay with text and icons */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-primary/90 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-center font-medium font-title text-background text-xs leading-tight">
                            {member.fullName}
                          </span>
                          {(member.github || member.linkedin) && (
                            <div className="flex items-center justify-center gap-2">
                              {member.github && (
                                <a
                                  href={member.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-background transition-colors hover:text-background/70"
                                >
                                  <Github className="h-4 w-4" />
                                </a>
                              )}
                              {member.linkedin && (
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-background transition-colors hover:text-background/70"
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-primary/20 bg-primary/20 font-bold font-title text-2xl text-primary transition-all group-hover:border-primary group-hover:bg-primary/90">
                        <span className="text-2xl transition-opacity group-hover:opacity-0">
                          {member.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-center font-medium font-title text-background text-xs leading-tight">
                            {member.fullName}
                          </span>
                          {(member.github || member.linkedin) && (
                            <div className="flex items-center justify-center gap-2">
                              {member.github && (
                                <a
                                  href={member.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-background transition-colors hover:text-background/70"
                                >
                                  <Github className="h-4 w-4" />
                                </a>
                              )}
                              {member.linkedin && (
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-background transition-colors hover:text-background/70"
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <div className="prose prose-invert prose-lg max-w-none border-primary/20 border-l-2 pl-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({ src, alt, ...props }) => {
                  // Handle relative paths - resolve to GitHub raw URL or use project logoUrl
                  let imageSrc = src || '';
                  if (imageSrc.startsWith('./') && project.repoUrl) {
                    // Convert relative path to GitHub raw URL
                    const repoMatch = project.repoUrl.match(
                      /github\.com\/([^/]+)\/([^/]+)/,
                    );
                    if (repoMatch) {
                      const [, owner, repo] = repoMatch;
                      const filePath = imageSrc.replace('./', '');
                      imageSrc = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
                    }
                  }
                  // If it's project-logo.png, use the stored logoUrl
                  if (
                    imageSrc.includes('project-logo.png') &&
                    project.logoUrl
                  ) {
                    imageSrc = project.logoUrl;
                  }
                  return (
                    // biome-ignore lint/performance/noImgElement: ReactMarkdown renders markdown img tags
                    <img
                      src={imageSrc}
                      alt={alt}
                      className="h-auto max-h-96 max-w-full rounded-lg object-contain"
                      {...props}
                    />
                  );
                },
              }}
            >
              {project.description}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
