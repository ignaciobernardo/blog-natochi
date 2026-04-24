import { CronExpressionParser } from 'cron-parser';
import { CHILE_TIMEZONE } from '@/src/lib/utils/timezone';
import { assignTeamSlugs } from './assign-team-slugs.job';
import { bulkRejectSubmissions } from './bulk-reject-submissions.job';
import { checkPresentationUploads } from './check-presentation-uploads.job';
import { checkSpotifyTrack } from './check-spotify-track.job';
import { expireOnboardingRequests } from './expire-onboarding-requests.job';
import { expireSelfFinanceRequests } from './expire-self-finance-requests.job';
import { exportAllParticipants } from './export-all-participants.job';
import { exportParticipants } from './export-participants.job';
import { processEmailQueue } from './process-email-queue.job';
import { remindOnboardingRequests } from './remind-onboarding-requests.job';
import { remindRawVideoUploads } from './remind-raw-video-uploads.job';
import { remindSelfFinanceRequests } from './remind-self-finance-requests.job';
import { requestOnboarding } from './request-onboarding.job';
import { sendConfirmationEmails26Ba } from './send-confirmation-emails-26-ba.job';
import { sendEventPhotos } from './send-event-photos.job';
import { sendFeedbackEmails } from './send-feedback-emails.job';
import { sendFeedbackReminderEmails } from './send-feedback-reminder-emails.job';
import { sendVotingAnnouncement } from './send-voting-announcement.job';
import { sendVotingResults } from './send-voting-results.job';
import { sendVotingStarted } from './send-voting-started.job';
import { sendWelcomeEmails } from './send-welcome-emails.job';
import { submitAnthropicForms } from './submit-anthropic-forms.job';
import { syncProjects } from './sync-projects.job';
import { validateTeamRepos } from './validate-team-repos.job';

export type CronJobCallback = () => Promise<undefined | string>;

export interface CronJobDefinition {
  name: string;
  schedule: string | null;
  callback: CronJobCallback;
  description?: string;
  returnsDownload?: boolean;
}

export const cronJobs: CronJobDefinition[] = [
  {
    name: 'submit-anthropic-forms',
    schedule: '* * * * *',
    callback: submitAnthropicForms as CronJobCallback,
    description:
      'Submit Anthropic credit forms to Google Forms every minute (50 in parallel)',
  },
  {
    name: 'process-email-queue',
    schedule: '*/10 * * * * *',
    callback: processEmailQueue as CronJobCallback,
    description: 'Process pending emails from queue every 10 seconds',
  },
  {
    name: 'check-spotify-track',
    schedule: '*/5 * * * * *',
    callback: checkSpotifyTrack as CronJobCallback,
    description: 'Check Spotify for track changes every 5 seconds',
  },
  {
    name: 'remind-self-finance-requests',
    schedule: '*/10 * * * *',
    callback: remindSelfFinanceRequests as CronJobCallback,
    description: 'Send 24h reminder for self-finance requests every 10 minutes',
  },
  {
    name: 'expire-self-finance-requests',
    schedule: '*/10 * * * *',
    callback: expireSelfFinanceRequests as CronJobCallback,
    description:
      'Check for expired self-finance requests (>48h) and auto-reject every 10 minutes',
  },
  {
    name: 'remind-onboarding-requests',
    schedule: '*/10 * * * *',
    callback: remindOnboardingRequests as CronJobCallback,
    description:
      'Send reminders for onboarding requests (24h, 12h, 3h, 1h) every 10 minutes',
  },
  {
    name: 'expire-onboarding-requests',
    schedule: '*/10 * * * *',
    callback: expireOnboardingRequests as CronJobCallback,
    description:
      'Check for expired onboarding requests (>36h) and auto-expire every 10 minutes',
  },
  {
    name: 'request-onboarding',
    schedule: null,
    callback: requestOnboarding as CronJobCallback,
    description:
      'One-off job to move all approved submissions to onboarding_request',
  },
  {
    name: 'bulk-reject-submissions',
    schedule: null,
    callback: bulkRejectSubmissions as CronJobCallback,
    description:
      'Bulk reject up to 100 submissions in received or priority_waiting status',
  },
  {
    name: 'send-welcome-emails',
    schedule: null,
    callback: sendWelcomeEmails as CronJobCallback,
    description:
      "One-off job to send welcome emails to all hackers who completed onboarding but haven't received the email yet",
  },
  {
    name: 'send-confirmation-emails-26-ba',
    schedule: null,
    callback: sendConfirmationEmails26Ba as CronJobCallback,
    description: `One-off job to send confirmation emails to Platanus Hack 26 BA hackers in "received" submissions when they don't have a non-failed confirmation email`,
  },
  {
    name: 'send-event-photos',
    schedule: null,
    callback: sendEventPhotos as CronJobCallback,
    description:
      'One-off job to send event photos emails to all team members from Platanus Hack 25',
  },
  {
    name: 'send-voting-announcement',
    schedule: null,
    callback: sendVotingAnnouncement as CronJobCallback,
    description:
      'One-off job to send voting announcement emails to all team members with projects that have video start time set',
  },
  {
    name: 'send-voting-started',
    schedule: null,
    callback: sendVotingStarted as CronJobCallback,
    description:
      'One-off job to send voting started emails to all team members with projects that have video start time set',
  },
  {
    name: 'send-voting-results',
    schedule: null,
    callback: sendVotingResults as CronJobCallback,
    description:
      'One-off job to send voting results emails to all team members with projects that have video start time set',
  },
  {
    name: 'send-feedback-emails',
    schedule: null,
    callback: sendFeedbackEmails as CronJobCallback,
    description:
      'One-off job to send feedback request emails to hackers who attended the event (have teamId set)',
  },
  {
    name: 'send-feedback-reminder-emails',
    schedule: '0 9 * * *',
    callback: sendFeedbackReminderEmails as CronJobCallback,
    description:
      'Daily job (9am Chile) to send feedback reminder emails to hackers who attended but have not submitted feedback yet. Stops after Feb 6, 2026 deadline.',
  },
  {
    name: 'assign-team-slugs',
    schedule: null,
    callback: assignTeamSlugs as CronJobCallback,
    description:
      'One-off job to assign slugs to teams based on member count (team-X for 2+ members, solo-X for 1 member, delete teams with 0 members)',
  },
  {
    name: 'validate-team-repos',
    schedule: null,
    callback: validateTeamRepos as CronJobCallback,
    description:
      'One-off job to validate all team repositories and check for required files (project-logo.png, platanus-hack-project.json, project-description.md)',
  },
  {
    name: 'check-presentation-uploads',
    schedule: '*/10 * * * *',
    callback: checkPresentationUploads as CronJobCallback,
    description:
      'Check Google Drive for presentation uploads (slides PDF and demo videos) and notify via Slack every 10 minutes',
  },
  {
    name: 'remind-raw-video-uploads',
    schedule: '*/10 * * * *',
    callback: remindRawVideoUploads as CronJobCallback,
    description:
      'Check Google Sheets for teams missing raw video URLs and send reminder emails (with special Nov 26/27 logic and 24h intervals) every 10 minutes',
  },
  {
    name: 'export-participants',
    schedule: null,
    callback: exportParticipants as CronJobCallback,
    description:
      'One-off job to export participant database for Platanus Hack 25 in CSV format with team, project, and raw video URLs',
    returnsDownload: true,
  },
  {
    name: 'export-all-participants',
    schedule: null,
    callback: exportAllParticipants as CronJobCallback,
    description:
      'One-off job to export ALL hackers (selected and non-selected) for Platanus Hack 25 in CSV format, with Selected column to distinguish participants',
    returnsDownload: true,
  },
  {
    name: 'sync-projects',
    schedule: null,
    callback: syncProjects as CronJobCallback,
    description:
      'One-off job to sync project information from GitHub repos (name, description, logo, deploy URL) for all teams',
  },
];

export function getNextRunDate(
  cronExpression: string,
  currentDate = new Date(),
): Date {
  const interval = CronExpressionParser.parse(cronExpression, {
    currentDate,
    tz: CHILE_TIMEZONE,
  });
  return interval.next().toDate();
}

export function shouldRunJob(
  cronExpression: string | null,
  lastRun: Date | null,
  now = new Date(),
): boolean {
  if (cronExpression === null) {
    return false;
  }

  if (!lastRun) {
    return true;
  }

  const nextRunAfterLastRun = getNextRunDate(cronExpression, lastRun);
  return now >= nextRunAfterLastRun;
}
