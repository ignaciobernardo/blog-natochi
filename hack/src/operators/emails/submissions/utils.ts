export function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export function filterMembersByRecipientEmails<
  T extends {
    email: string;
  },
>(members: T[], recipientEmails?: string[]) {
  if (!recipientEmails) {
    return members;
  }

  const allowedRecipientEmails = new Set(
    recipientEmails.map((email) => email.toLowerCase()),
  );

  return members.filter((member) =>
    allowedRecipientEmails.has(member.email.toLowerCase()),
  );
}
