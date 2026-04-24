/**
 * Utilities for parsing and handling Slack mentions in text
 */

export interface ParsedMention {
  originalText: string; // e.g., "@rafael"
  username: string; // e.g., "rafael" (normalized)
}

/**
 * Extract all @mentions from text
 * Matches @username where username can contain letters, numbers, dots, underscores, hyphens
 */
export function extractMentions(text: string): ParsedMention[] {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const mentions: ParsedMention[] = [];
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: RegExp.exec requires assignment in loop
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      originalText: match[0], // e.g., "@rafael"
      username: match[1].toLowerCase(), // e.g., "rafael"
    });
  }

  // Remove duplicates
  return Array.from(new Map(mentions.map((m) => [m.username, m])).values());
}

/**
 * Check if text contains any mentions
 */
export function hasMentions(text: string): boolean {
  return /@([a-zA-Z0-9._-]+)/g.test(text);
}

/**
 * Replace mentions in text with adapted format
 */
export function replaceMentions(
  text: string,
  mentionMap: Map<string, string>,
): string {
  let adaptedText = text;

  mentionMap.forEach((replacement, username) => {
    // Replace @username with Slack mention format (<@USERID>)
    const mentionRegex = new RegExp(`@${username}\\b`, 'gi');
    adaptedText = adaptedText.replace(mentionRegex, replacement);
  });

  return adaptedText;
}
