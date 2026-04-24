import { NextResponse } from 'next/server';

export async function GET() {
  const deploymentId =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'dev';

  return NextResponse.json(
    { hash: deploymentId },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
