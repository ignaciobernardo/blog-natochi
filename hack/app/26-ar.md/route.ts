import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src/content/26-ar.md');
  const body = await readFile(filePath, 'utf8');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
      Vary: 'Accept',
    },
  });
}
