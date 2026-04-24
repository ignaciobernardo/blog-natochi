import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { teams } from '@/src/lib/db/schema';
import { updateProjectInfo } from '@/src/operators/github-webhook/update-project-info.operator';
import { validateSubmission } from '@/src/operators/github-webhook/validate-submission.operator';
import {
  getDefaultEvent,
  isEventHappening,
  isVotingPeriod,
} from '@/src/queries/events';

interface GitHubPushPayload {
  ref: string;
  repository: {
    name: string;
    full_name: string;
    default_branch: string;
  };
  head_commit: {
    id: string;
    message: string;
  };
}

function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function extractTeamSlug(repoName: string): string | null {
  const match = repoName.match(/^platanus-hack-25-(.+)$/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const githubEvent = request.headers.get('x-github-event');
    const contentType = request.headers.get('content-type');

    if (githubEvent !== 'push') {
      return NextResponse.json(
        { message: 'Event type not supported' },
        { status: 200 },
      );
    }

    const rawBody = await request.text();

    let payload: GitHubPushPayload;

    // GitHub can send webhooks as JSON or URL-encoded form data
    if (contentType?.includes('application/json')) {
      payload = JSON.parse(rawBody);
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Parse URL-encoded body and extract the 'payload' parameter
      const params = new URLSearchParams(rawBody);
      const payloadStr = params.get('payload');
      if (!payloadStr) {
        return NextResponse.json(
          { error: 'No payload found in form data' },
          { status: 400 },
        );
      }
      payload = JSON.parse(payloadStr);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret) {
      const isValid = verifyGitHubSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 },
        );
      }
    }

    const repoName = payload.repository.name;
    const teamSlug = extractTeamSlug(repoName);

    if (!teamSlug) {
      console.log(`Ignoring repository: ${repoName} (not a team repo)`);
      return NextResponse.json(
        { message: 'Not a team repository' },
        { status: 200 },
      );
    }

    const commitSha = payload.head_commit.id.substring(0, 7);
    const commitMessage = payload.head_commit.message;
    const [owner] = payload.repository.full_name.split('/');
    const ref = payload.head_commit.id;

    const event = await getDefaultEvent();
    if (!event) {
      console.log('[Webhook] No default event found, skipping webhook');
      return NextResponse.json(
        { message: 'No active event found' },
        { status: 200 },
      );
    }

    if (isEventHappening(event)) {
      await validateSubmission({
        teamSlug,
        owner,
        repoName,
        ref,
        commitSha,
        commitMessage,
      });

      return NextResponse.json({
        success: true,
        teamSlug,
        action: 'validated',
      });
    }

    if (isVotingPeriod(event)) {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.slug, teamSlug))
        .limit(1);

      if (!team) {
        console.log(`[Webhook] Team not found: ${teamSlug}`);
        return NextResponse.json(
          { message: 'Team not found' },
          { status: 404 },
        );
      }

      await updateProjectInfo({
        teamSlug,
        teamId: team.id,
        owner,
        repoName,
        ref,
        commitSha,
        commitMessage,
      });

      return NextResponse.json({
        success: true,
        teamSlug,
        action: 'updated',
      });
    }

    console.log(
      `[Webhook] No action for team ${teamSlug} - event not happening and voting not started`,
    );
    return NextResponse.json(
      { message: 'No action taken - outside event and voting periods' },
      { status: 200 },
    );
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
