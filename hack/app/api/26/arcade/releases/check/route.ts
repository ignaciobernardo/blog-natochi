import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { checkArcadeRelease } from '@/src/operators/arcade-release-check';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  try {
    const result = await checkArcadeRelease(payload);

    if (!result.available) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          slug: result.slug,
          codeHash: result.codeHash,
          conflicts: result.conflicts,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      available: true,
      slug: result.slug,
      codeHash: result.codeHash,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message ?? 'Invalid request',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Check failed',
      },
      {
        status:
          error instanceof Error && error.message.includes('not found')
            ? 400
            : 502,
      },
    );
  }
}
