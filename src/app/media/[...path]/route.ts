import { promises as fs } from 'node:fs';
import { extOf, filePath, MIME } from '@/lib/media';

export const dynamic = 'force-dynamic';

/**
 * Serves files from content/uploads. They are not in /public on purpose: Next.js only serves
 * /public files that existed at build time, but the admin adds and replaces files at runtime.
 */
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const full = segments.length === 1 ? filePath(segments[0]) : null;
  if (!full) return new Response('Not found', { status: 404 });

  let st;
  try {
    st = await fs.stat(full);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const ext = extOf(segments[0]);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers = new Headers({
    'Content-Type': MIME[ext],
    ETag: etag,
    'Last-Modified': st.mtime.toUTCString(),
    // Always revalidate (cheap 304) so a replaced file shows up immediately.
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  });
  // An uploaded SVG must never run script in our origin.
  if (ext === 'svg') headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");

  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });

  const body = await fs.readFile(full);
  headers.set('Content-Length', String(body.length));
  return new Response(new Uint8Array(body), { headers });
}
