import { revalidatePath } from 'next/cache';
import { guard } from '@/lib/auth';
import { ContentError, readContentForAdmin, saveContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await guard(req, { mutating: false });
  if (denied) return denied;
  try {
    return Response.json({ ok: true, ...(await readContentForAdmin()) });
  } catch (e) {
    const message = e instanceof ContentError ? e.message : 'Could not read site.json.';
    return Response.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await guard(req, { mutating: true });
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { content?: unknown; baseEtag?: unknown } | null;
  if (!body || typeof body !== 'object' || !('content' in body)) {
    return Response.json({ ok: false, message: 'Expected { content, baseEtag }.' }, { status: 400 });
  }

  const result = await saveContent(body.content, typeof body.baseEtag === 'string' ? body.baseEtag : undefined);
  if (!result.ok) return Response.json(result, { status: result.status });

  // Rebuild the static pages (home, sitemap, robots, social card, icon) from the new JSON.
  revalidatePath('/', 'layout');
  return Response.json({ ok: true, content: result.content, etag: result.etag });
}
