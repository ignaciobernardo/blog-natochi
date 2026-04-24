'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  User,
  UserCheck,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { Textarea } from '@/src/components/ui/textarea';
import { getCountryDisplay } from '@/src/lib/utils/countries';
import { addHackerNoteAction } from '../_actions/add-hacker-note.action';
import { impersonateHackerAction } from '../_actions/impersonate-hacker.action';

interface TeamMembersProps {
  submissionId: string;
  isAdminFull?: boolean;
  members: Array<{
    id: string;
    email: string;
    fullName: string;
    github: string | null;
    linkedin: string | null;
    gender: 'male' | 'female' | null;
    role: string;
    isPreviousParticipant: boolean;
    hack24SubmissionId: string | null;
    profile: {
      age: number | null;
      bio: string | null;
      education: string | null;
      isVeteran: boolean;
      previousHackathons: string | null;
      shirtSize: string | null;
      diet: string | null;
      allergies: string | null;
      physicalIssues: string | null;
      shareInfoWithSponsors: boolean;
      country: string | null;
      nationalId: string | null;
      shoeSize: number | null;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      discordId: string | null;
      discordUsername: string | null;
      discordConnectedAt: Date | null;
      anthropicOrgId: string | null;
      anthropicUsedProducts: string[] | null;
      anthropicAccountEmail: string | null;
      anthropicUpdates: boolean | null;
      anthropicInfoSentAt: Date | null;
      onboardCompleteAt: Date | null;
      termsAcceptedAt: Date | null;
    } | null;
    notes: Array<{
      id: string;
      hackerId: string;
      authorAdminId: string;
      body: string;
      createdAt: Date;
      author: {
        fullName: string;
        email: string;
      };
    }>;
  }>;
}

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getGitHubAvatarUrl = (githubUsername: string | null) => {
  if (!githubUsername) return null;
  const username = githubUsername.replace(
    /^https?:\/\/(www\.)?github\.com\//,
    '',
  );
  return `https://github.com/${username}.png`;
};

export function TeamMembers({
  submissionId,
  isAdminFull = false,
  members,
}: TeamMembersProps) {
  const router = useRouter();
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {},
  );
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingHackerId, setPendingHackerId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [impersonatingHackerId, setImpersonatingHackerId] = useState<
    string | null
  >(null);

  const toggleNoteExpansion = (hackerId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [hackerId]: !prev[hackerId],
    }));
  };

  const handleNoteSubmit = async (
    hackerId: string,
    e: React.FormEvent | React.KeyboardEvent,
  ) => {
    e.preventDefault();
    const noteBody = noteInputs[hackerId]?.trim();
    if (!noteBody || isPending) return;

    setErrors((prev) => ({ ...prev, [hackerId]: '' }));
    setPendingHackerId(hackerId);

    const noteToSubmit = noteBody;
    setNoteInputs((prev) => ({ ...prev, [hackerId]: '' }));

    startTransition(async () => {
      const result = await addHackerNoteAction(
        submissionId,
        hackerId,
        noteToSubmit,
      );
      setPendingHackerId(null);

      if (!result.success) {
        setErrors((prev) => ({
          ...prev,
          [hackerId]: result.error || 'Failed to add note',
        }));
        setNoteInputs((prev) => ({ ...prev, [hackerId]: noteToSubmit }));
      } else {
        // Collapse the note input after successful submission
        setExpandedNotes((prev) => ({ ...prev, [hackerId]: false }));
      }
    });
  };

  const handleKeyDown = (
    hackerId: string,
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNoteSubmit(hackerId, e);
    }
  };

  const handleImpersonate = async (hackerId: string) => {
    setImpersonatingHackerId(hackerId);
    try {
      const result = await impersonateHackerAction(hackerId);

      if (!result.success) {
        alert(result.error || 'Failed to impersonate user');
        setImpersonatingHackerId(null);
        return;
      }

      router.push('/hacker' as any);
      router.refresh();
    } catch (error) {
      console.error('Failed to impersonate:', error);
      alert('Failed to impersonate user');
      setImpersonatingHackerId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={getGitHubAvatarUrl(member.github) || undefined}
                    alt={member.fullName}
                  />
                  <AvatarFallback>
                    {getInitials(member.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{member.fullName}</div>
                      {member.role === 'leader' && (
                        <Badge variant="outline" className="text-xs">
                          Leader
                        </Badge>
                      )}
                      {member.profile?.isVeteran && (
                        <Badge variant="secondary" className="text-xs">
                          Veteran
                        </Badge>
                      )}
                      {member.gender === 'female' && (
                        <Badge
                          variant="outline"
                          className="border-pink-300 bg-pink-100 text-pink-800 text-xs"
                        >
                          <UserRound className="mr-1 h-3 w-3" />
                          Woman
                        </Badge>
                      )}
                      {member.isPreviousParticipant && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-700 text-xs"
                        >
                          Hack 24
                        </Badge>
                      )}
                      {!member.isPreviousParticipant &&
                        member.hack24SubmissionId &&
                        member.hack24SubmissionId !== submissionId && (
                          <a
                            href={`/admin/submissions/${member.hack24SubmissionId}`}
                            className="hover:underline"
                          >
                            <Badge
                              variant="outline"
                              className="border-purple-200 bg-purple-50 text-purple-700 text-xs"
                            >
                              Hack 24 Applicant
                            </Badge>
                          </a>
                        )}
                      {member.profile?.onboardCompleteAt && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700 text-xs"
                        >
                          Onboarded 🚢
                        </Badge>
                      )}
                    </div>
                    {isAdminFull && member.profile?.onboardCompleteAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImpersonate(member.id)}
                        disabled={impersonatingHackerId === member.id}
                        className="h-7 gap-1 text-xs"
                      >
                        {impersonatingHackerId === member.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Impersonating...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Impersonate
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Mail className="h-3 w-3" />
                    <a
                      href={`mailto:${member.email}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>

                  <div className="flex gap-3 text-sm">
                    {member.github && (
                      <a
                        href={
                          member.github.startsWith('http')
                            ? member.github
                            : `https://github.com/${member.github}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {member.linkedin && (
                      <a
                        href={
                          member.linkedin.startsWith('http')
                            ? member.linkedin
                            : `https://linkedin.com/in/${member.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {member.profile && (
                <>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {member.profile.age && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Age:
                        </span>{' '}
                        <span>{member.profile.age}</span>
                      </div>
                    )}

                    {member.profile.country && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Country:
                        </span>{' '}
                        <span>{getCountryDisplay(member.profile.country)}</span>
                      </div>
                    )}

                    {member.profile.education && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Education:
                        </span>{' '}
                        <span>{member.profile.education}</span>
                      </div>
                    )}

                    {member.profile.previousHackathons && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Previous Hackathons:
                        </span>{' '}
                        <span>{member.profile.previousHackathons}</span>
                      </div>
                    )}

                    {member.profile.bio && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Bio:
                        </span>{' '}
                        <p className="mt-1 text-xs">{member.profile.bio}</p>
                      </div>
                    )}

                    {member.profile.shirtSize && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Shirt Size:
                        </span>{' '}
                        <span>{member.profile.shirtSize}</span>
                      </div>
                    )}

                    {member.profile.diet && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Diet:
                        </span>{' '}
                        <span>{member.profile.diet}</span>
                      </div>
                    )}

                    {member.profile.allergies && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Allergies:
                        </span>{' '}
                        <span className="text-red-600">
                          {member.profile.allergies}
                        </span>
                      </div>
                    )}

                    {member.profile.physicalIssues && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Physical Issues:
                        </span>{' '}
                        <span className="text-orange-600">
                          {member.profile.physicalIssues}
                        </span>
                      </div>
                    )}

                    {member.profile.shareInfoWithSponsors && (
                      <div className="sm:col-span-2">
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>Willing to share info with sponsors</span>
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Onboarding Information */}
              {member.profile?.onboardCompleteAt && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-3">
                    <div className="font-medium text-sm">
                      Onboarding Information
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      {member.profile.termsAcceptedAt && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Terms Accepted:
                          </span>{' '}
                          <span>
                            {format(
                              new Date(member.profile.termsAcceptedAt),
                              'MMM d, yyyy',
                            )}
                          </span>
                        </div>
                      )}

                      {member.profile.onboardCompleteAt && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Onboarding Completed:
                          </span>{' '}
                          <span>
                            {format(
                              new Date(member.profile.onboardCompleteAt),
                              'MMM d, yyyy',
                            )}
                          </span>
                        </div>
                      )}

                      {member.profile.discordUsername && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Discord:
                          </span>{' '}
                          <span className="font-mono">
                            {member.profile.discordUsername}
                          </span>
                        </div>
                      )}

                      {member.profile.discordConnectedAt && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Discord Connected:
                          </span>{' '}
                          <span>
                            {format(
                              new Date(member.profile.discordConnectedAt),
                              'MMM d, yyyy',
                            )}
                          </span>
                        </div>
                      )}

                      {member.profile.anthropicAccountEmail && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-muted-foreground">
                            Anthropic Account:
                          </span>{' '}
                          <span>{member.profile.anthropicAccountEmail}</span>
                        </div>
                      )}

                      {member.profile.anthropicOrgId && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-muted-foreground">
                            Anthropic Org ID:
                          </span>{' '}
                          <span className="font-mono text-xs">
                            {member.profile.anthropicOrgId}
                          </span>
                        </div>
                      )}

                      {member.profile.anthropicUsedProducts &&
                        member.profile.anthropicUsedProducts.length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="font-medium text-muted-foreground">
                              Anthropic Products Used:
                            </span>{' '}
                            <span>
                              {member.profile.anthropicUsedProducts.join(', ')}
                            </span>
                          </div>
                        )}

                      {member.profile.anthropicUpdates !== null && (
                        <div className="sm:col-span-2">
                          <span className="flex items-center gap-1 text-sm">
                            {member.profile.anthropicUpdates ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span>Subscribed to Anthropic updates</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                Not subscribed to Anthropic updates
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {member.profile.nationalId && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            National ID:
                          </span>{' '}
                          <span className="font-mono">
                            {member.profile.nationalId}
                          </span>
                        </div>
                      )}

                      {member.profile.shoeSize && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Shoe Size:
                          </span>{' '}
                          <span>{member.profile.shoeSize}</span>
                        </div>
                      )}

                      {member.profile.emergencyContactName && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Emergency Contact:
                          </span>{' '}
                          <span>{member.profile.emergencyContactName}</span>
                        </div>
                      )}

                      {member.profile.emergencyContactPhone && (
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Emergency Phone:
                          </span>{' '}
                          <span>{member.profile.emergencyContactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notes section - always visible */}
              {member.notes.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="space-y-2">
                    {member.notes.map((note) => (
                      <div
                        key={note.id}
                        className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <User className="h-3 w-3" />
                            {note.author.fullName}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(note.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {note.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation bubble and add note input */}
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleNoteExpansion(member.id)}
                    className="relative flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {expandedNotes[member.id] ? 'Hide input' : 'Add note'}
                    </span>
                  </button>
                </div>

                {expandedNotes[member.id] && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Textarea
                        placeholder="Add a note about this hacker... (Press Enter to submit, Shift+Enter for new line)"
                        value={noteInputs[member.id] || ''}
                        onChange={(e) =>
                          setNoteInputs((prev) => ({
                            ...prev,
                            [member.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(member.id, e)}
                        disabled={isPending && pendingHackerId === member.id}
                        className="min-h-[80px] resize-none pr-10"
                      />
                      {isPending && pendingHackerId === member.id && (
                        <div className="absolute top-3 right-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {errors[member.id] && (
                      <p className="text-red-600 text-sm">
                        {errors[member.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
