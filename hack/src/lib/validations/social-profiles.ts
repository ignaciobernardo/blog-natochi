export const GITHUB_PROFILE_URL_REGEX =
  /^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

export const LINKEDIN_PROFILE_URL_REGEX =
  /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/;

export const GITHUB_PROFILE_URL_MESSAGE =
  'Must be a valid GitHub profile URL in the format: https://github.com/username (no trailing slash)';

export const LINKEDIN_PROFILE_URL_MESSAGE =
  'Must be a valid LinkedIn profile URL in the format: https://linkedin.com/in/username or https://www.linkedin.com/in/username (no trailing slash)';

export function isValidGitHubProfileUrl(url: string): boolean {
  return GITHUB_PROFILE_URL_REGEX.test(url);
}

export function isValidLinkedInProfileUrl(url: string): boolean {
  return LINKEDIN_PROFILE_URL_REGEX.test(url);
}
