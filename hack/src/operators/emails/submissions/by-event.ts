import { approvedSubmissionEmailSender25 } from '@/src/operators/emails/25/submissions/approved-submission-email-sender';
import { askingSelfFinanceTripEmailSender25 } from '@/src/operators/emails/25/submissions/asking-self-finance-trip-email-sender';
import { confirmationSubmissionEmailSender25 } from '@/src/operators/emails/25/submissions/confirmation-submission-email-sender';
import { onboardingCompleteEmailSender25 } from '@/src/operators/emails/25/submissions/onboarding-complete-email-sender';
import { onboardingExpiredEmailSender25 } from '@/src/operators/emails/25/submissions/onboarding-expired-email-sender';
import { onboardingReminderEmailSender25 } from '@/src/operators/emails/25/submissions/onboarding-reminder-email-sender';
import { onboardingRequestEmailSender25 } from '@/src/operators/emails/25/submissions/onboarding-request-email-sender';
import { priorityWaitingEmailSender25 } from '@/src/operators/emails/25/submissions/priority-waiting-email-sender';
import { rejectedSubmissionEmailSender25 } from '@/src/operators/emails/25/submissions/rejected-submission-email-sender';
import { selfFinanceExpiredEmailSender25 } from '@/src/operators/emails/25/submissions/self-finance-expired-email-sender';
import { selfFinanceRejectionEmailSender25 } from '@/src/operators/emails/25/submissions/self-finance-rejection-email-sender';
import { selfFinanceReminderEmailSender25 } from '@/src/operators/emails/25/submissions/self-finance-reminder-email-sender';
import { waitingListEmailSender25 } from '@/src/operators/emails/25/submissions/waiting-list-email-sender';
import { welcomeEmailSender25 } from '@/src/operators/emails/25/submissions/welcome-email-sender';
import { withdrawnSubmissionEmailSender25 } from '@/src/operators/emails/25/submissions/withdrawn-submission-email-sender';
import { approvedSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/approved-submission-email-sender';
import { askingSelfFinanceTripEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/asking-self-finance-trip-email-sender';
import { confirmationSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/confirmation-submission-email-sender';
import { onboardingCompleteEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/onboarding-complete-email-sender';
import { onboardingExpiredEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/onboarding-expired-email-sender';
import { onboardingReminderEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/onboarding-reminder-email-sender';
import { onboardingRequestEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/onboarding-request-email-sender';
import { priorityConfirmationSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/priority-confirmation-submission-email-sender';
import { priorityWaitingEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/priority-waiting-email-sender';
import { rejectedSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/rejected-submission-email-sender';
import { selfFinanceExpiredEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/self-finance-expired-email-sender';
import { selfFinanceRejectionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/self-finance-rejection-email-sender';
import { selfFinanceReminderEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/self-finance-reminder-email-sender';
import { waitingListEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/waiting-list-email-sender';
import { welcomeEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/welcome-email-sender';
import { withdrawnSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/withdrawn-submission-email-sender';

const senderByEventSlug = {
  '25': {
    confirmationSubmissionEmailSender: confirmationSubmissionEmailSender25,
    priorityConfirmationSubmissionEmailSender:
      confirmationSubmissionEmailSender25,
    approvedSubmissionEmailSender: approvedSubmissionEmailSender25,
    onboardingCompleteEmailSender: onboardingCompleteEmailSender25,
    onboardingExpiredEmailSender: onboardingExpiredEmailSender25,
    onboardingReminderEmailSender: onboardingReminderEmailSender25,
    onboardingRequestEmailSender: onboardingRequestEmailSender25,
    priorityWaitingEmailSender: priorityWaitingEmailSender25,
    rejectedSubmissionEmailSender: rejectedSubmissionEmailSender25,
    waitingListEmailSender: waitingListEmailSender25,
    welcomeEmailSender: welcomeEmailSender25,
    withdrawnSubmissionEmailSender: withdrawnSubmissionEmailSender25,
    askingSelfFinanceTripEmailSender: askingSelfFinanceTripEmailSender25,
    selfFinanceExpiredEmailSender: selfFinanceExpiredEmailSender25,
    selfFinanceRejectionEmailSender: selfFinanceRejectionEmailSender25,
    selfFinanceReminderEmailSender: selfFinanceReminderEmailSender25,
  },
  '26-ar': {
    confirmationSubmissionEmailSender: confirmationSubmissionEmailSender26Ar,
    priorityConfirmationSubmissionEmailSender:
      priorityConfirmationSubmissionEmailSender26Ar,
    approvedSubmissionEmailSender: approvedSubmissionEmailSender26Ar,
    onboardingCompleteEmailSender: onboardingCompleteEmailSender26Ar,
    onboardingExpiredEmailSender: onboardingExpiredEmailSender26Ar,
    onboardingReminderEmailSender: onboardingReminderEmailSender26Ar,
    onboardingRequestEmailSender: onboardingRequestEmailSender26Ar,
    priorityWaitingEmailSender: priorityWaitingEmailSender26Ar,
    rejectedSubmissionEmailSender: rejectedSubmissionEmailSender26Ar,
    waitingListEmailSender: waitingListEmailSender26Ar,
    welcomeEmailSender: welcomeEmailSender26Ar,
    withdrawnSubmissionEmailSender: withdrawnSubmissionEmailSender26Ar,
    askingSelfFinanceTripEmailSender: askingSelfFinanceTripEmailSender26Ar,
    selfFinanceExpiredEmailSender: selfFinanceExpiredEmailSender26Ar,
    selfFinanceRejectionEmailSender: selfFinanceRejectionEmailSender26Ar,
    selfFinanceReminderEmailSender: selfFinanceReminderEmailSender26Ar,
  },
} as const;

const defaultEventSlug = '25';

function getEventSenders(eventSlug: string) {
  return (
    senderByEventSlug[eventSlug as keyof typeof senderByEventSlug] ??
    senderByEventSlug[defaultEventSlug]
  );
}

export function getConfirmationSubmissionEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).confirmationSubmissionEmailSender;
}

export function getPriorityConfirmationSubmissionEmailSender(
  eventSlug: string,
) {
  return getEventSenders(eventSlug).priorityConfirmationSubmissionEmailSender;
}

export function getApprovedSubmissionEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).approvedSubmissionEmailSender;
}

export function getOnboardingCompleteEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).onboardingCompleteEmailSender;
}

export function getOnboardingExpiredEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).onboardingExpiredEmailSender;
}

export function getOnboardingReminderEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).onboardingReminderEmailSender;
}

export function getOnboardingRequestEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).onboardingRequestEmailSender;
}

export function getPriorityWaitingEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).priorityWaitingEmailSender;
}

export function getRejectedSubmissionEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).rejectedSubmissionEmailSender;
}

export function getWaitingListEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).waitingListEmailSender;
}

export function getWelcomeEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).welcomeEmailSender;
}

export function getWithdrawnSubmissionEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).withdrawnSubmissionEmailSender;
}

export function getAskingSelfFinanceTripEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).askingSelfFinanceTripEmailSender;
}

export function getSelfFinanceExpiredEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).selfFinanceExpiredEmailSender;
}

export function getSelfFinanceRejectionEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).selfFinanceRejectionEmailSender;
}

export function getSelfFinanceReminderEmailSender(eventSlug: string) {
  return getEventSenders(eventSlug).selfFinanceReminderEmailSender;
}
