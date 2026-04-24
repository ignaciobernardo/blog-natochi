import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import type { UserType } from '@/src/lib/db/schema';
import * as schema from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';

const isProductionBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build';

// Avoid DB access during Next.js build-time module evaluation.
const adminUserIdsPromise = isProductionBuildPhase
  ? Promise.resolve<string[]>([])
  : db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.userType, 'admin'),
          eq(schema.user.adminRole, 'full'),
        ),
      )
      .then((admins) => admins.map((admin) => admin.id))
      .catch((error) => {
        console.error('Failed to fetch admin users:', error);
        return [];
      });

export const auth = betterAuth({
  trustedOrigins: [
    'https://hack.platan.us',
    'https://*.hack.platan.us',
    'http://localhost:3000',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ['user:email'],
      getUserInfo: async (token) => {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });
        const profile = await response.json();

        // Look up the hacker by their GitHub username to get their registered email
        const githubUsername = profile.login;
        const githubUrl = `https://github.com/${githubUsername}`;

        let email = profile.email;
        let _hackerId: string | null = null;

        try {
          // Case-insensitive lookup for GitHub URL
          const [hacker] = await db
            .select({
              email: schema.hackers.email,
              id: schema.hackers.id,
              github: schema.hackers.github,
            })
            .from(schema.hackers)
            .where(sql`LOWER(${schema.hackers.github}) = LOWER(${githubUrl})`)
            .limit(1);

          if (hacker) {
            email = hacker.email;
            _hackerId = hacker.id;

            // Update GitHub URL if case differs (keep canonical version from GitHub API)
            if (hacker.github !== githubUrl) {
              await db
                .update(schema.hackers)
                .set({ github: githubUrl })
                .where(eq(schema.hackers.id, hacker.id));
            }

            // Check if hacker has an approved submission in the default event
            const defaultEvent = await getDefaultEvent();
            if (!defaultEvent) {
              throw new APIError('BAD_REQUEST', {
                message:
                  'No active event found. Please contact the organizers.',
              });
            }

            const submissions = await db
              .select({ status: schema.submissions.status })
              .from(schema.hackerProfiles)
              .innerJoin(
                schema.submissions,
                eq(schema.hackerProfiles.submissionId, schema.submissions.id),
              )
              .where(
                and(
                  eq(schema.hackerProfiles.hackerId, hacker.id),
                  eq(schema.submissions.eventId, defaultEvent.id),
                ),
              );

            if (submissions.length === 0) {
              throw new APIError('FORBIDDEN', {
                message:
                  'You do not have a submission for this event. Please contact the organizers.',
              });
            }

            // Check if ANY submission is approved or onboarding_request
            const hasApprovedSubmission = submissions.some(
              (s) =>
                s.status === 'approved' ||
                s.status === 'onboarding_request' ||
                s.status === 'onboarding_complete',
            );

            if (!hasApprovedSubmission) {
              const statuses = submissions.map((s) => s.status).join(', ');
              throw new APIError('FORBIDDEN', {
                message: `None of your submissions are approved yet (statuses: ${statuses}). Only hackers with approved submissions can sign in.`,
              });
            }
          }
        } catch (error) {
          // Re-throw APIErrors (validation failures)
          if (error instanceof APIError) {
            throw error;
          }
          console.error('Failed to get hacker email:', error);
        }

        // Fallback to GitHub email if we couldn't get it from hacker record
        if (!email) {
          const emailResponse = await fetch(
            'https://api.github.com/user/emails',
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            },
          );
          const emails = await emailResponse.json();
          const primaryEmail = emails.find(
            (e: { primary: boolean; verified: boolean }) =>
              e.primary && e.verified,
          );
          email =
            primaryEmail?.email ||
            emails.find((e: { verified: boolean }) => e.verified)?.email ||
            emails[0]?.email;
        }

        return {
          user: {
            id: String(profile.id), // Use GitHub numeric ID as user ID
            name: String(profile.name || profile.login),
            email: String(email || ''),
            image: String(profile.avatar_url || ''),
            emailVerified: true,
            githubUsername: profile.login, // Pass GitHub username to hooks
          },
          data: {
            ...profile,
            // Store the username in the data so we can use it in hooks
            githubUsername: profile.login,
          },
        };
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      userType: {
        type: 'string',
        required: true,
        input: false,
        defaultValue: 'hacker',
      },
      linkedId: {
        type: 'string',
        required: false,
        input: false,
      },
      adminRole: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log(user);

          let existingHacker: Array<{ id: string; github: string | null }> = [];

          // For GitHub OAuth, lookup by GitHub URL only (case-insensitive)
          if ('githubUsername' in user) {
            const githubUsername = (user as { githubUsername?: string })
              .githubUsername;
            if (githubUsername) {
              const githubUrl = `https://github.com/${githubUsername}`;

              existingHacker = await db
                .select({
                  id: schema.hackers.id,
                  github: schema.hackers.github,
                })
                .from(schema.hackers)
                .where(
                  sql`LOWER(${schema.hackers.github}) = LOWER(${githubUrl})`,
                )
                .limit(1);
            }

            if (existingHacker.length === 0) {
              // This user is not in our hackers database - reject GitHub sign-up
              throw new APIError('FORBIDDEN', {
                message:
                  'Registration is by invitation only. Your GitHub account is not registered for this event. Please contact the organizers if you believe this is an error.',
              });
            }

            // User exists in hackers table - allow creation with hacker userType
            return {
              data: {
                ...user,
                userType: 'hacker' as UserType,
                linkedId: existingHacker[0].id, // Link to the hacker record
              },
            };
          }

          // For Google OAuth or other providers, create as public voter
          // No validation needed - anyone with a Google account can vote

          // Check if user already exists with this email (account linking scenario)
          const [existingUser] = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.email, user.email))
            .limit(1);

          if (existingUser) {
            // User exists with different provider - link the account to existing user
            // Update the user's image to use the Google profile picture
            await db
              .update(schema.user)
              .set({ image: user.image })
              .where(eq(schema.user.id, existingUser.id));

            // Return existing user data instead of creating a new user
            return {
              data: {
                ...user,
                id: existingUser.id, // Use existing user's ID to prevent duplicate creation
                userType: existingUser.userType,
                linkedId: existingUser.linkedId,
                adminRole: existingUser.adminRole,
              },
            };
          }

          // New user - create as voter
          return {
            data: {
              ...user,
              userType: 'voter' as UserType,
              linkedId: null,
            },
          };
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          // If this is a GitHub account, validate the username matches
          if (account.providerId === 'github' && account.accessToken) {
            // Fetch the GitHub profile to get the username
            const profileResponse = await fetch('https://api.github.com/user', {
              headers: {
                Authorization: `Bearer ${account.accessToken}`,
              },
            });
            const profile = await profileResponse.json();
            const githubUsername = profile.login;

            if (!githubUsername) {
              return { data: account };
            }

            // Override accountId with the username for easier reference
            account.accountId = githubUsername;

            // Find the user being created/linked by linkedId
            const [userAccount] = await db
              .select({
                linkedId: schema.user.linkedId,
              })
              .from(schema.user)
              .where(eq(schema.user.id, account.userId))
              .limit(1);

            if (userAccount?.linkedId) {
              // Get the hacker record by linkedId to check GitHub username
              const [hacker] = await db
                .select({ github: schema.hackers.github })
                .from(schema.hackers)
                .where(eq(schema.hackers.id, userAccount.linkedId))
                .limit(1);

              if (hacker?.github) {
                const expectedGithubUsername = hacker.github.split('/').pop();

                // Case-insensitive comparison for GitHub usernames
                if (
                  expectedGithubUsername?.toLowerCase() !==
                  githubUsername.toLowerCase()
                ) {
                  throw new APIError('FORBIDDEN', {
                    message: `This GitHub account (@${githubUsername}) does not match your registered GitHub username (@${expectedGithubUsername}). Please sign in with the correct GitHub account.`,
                  });
                }
              }
            }
          }

          return { data: account };
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    admin({
      impersonationSessionDuration: 60 * 60,
      adminUserIds: await adminUserIdsPromise,
    }),
  ],
});

export type Session = {
  session: typeof auth.$Infer.Session.session;
  user: typeof auth.$Infer.Session.user & {
    userType: UserType;
    linkedId?: string | null;
    adminRole?: string | null;
  };
};
