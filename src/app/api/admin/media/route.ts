import { revalidatePath } from 'next/cache';
import { guard } from '@/lib/auth';
import { getContent, mediaUsages } from '@/lib/content';
import { deleteMedia, listMedia, saveMedia, validName } from '@/lib/media';

export const dynamic = 'force-dynamic';

async function listWithUsage() {
  const [files, content] = await Promise.all([listMedia(), getContent().catch(() => null)]);
  const usage = content ? mediaUsages(content) : new Map<string, string[]>();
  return files.map((f) => ({ ...f, usedBy: usage.get(f.url) ?? [] }));
}

export async function GET(req: Request) {
  const denied = await guard(req, { mutating: false });
  if (denied) return denied;
  return Response.json({ ok: true, files: await listWithUsage() });
}

/** multipart/form-data: `files` (one or many) and optionally `replace=<existing name>`. */
export async function POST(req: Request) {
  const denied = await guard(req, { mutating: true });
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, message: 'Expected a multipart upload.' }, { status: 400 });

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  const replace = form.get('replace');
  if (files.length === 0) return Response.json({ ok: false, message: 'No file received.' }, { status: 400 });
  if (files.length > 20) return Response.json({ ok: false, message: 'Upload at most 20 files at a time.' }, { status: 400 });
  if (replace && files.length !== 1) return Response.json({ ok: false, message: 'Replace takes exactly one file.' }, { status: 400 });

  const results = [];
  for (const f of files) {
    const r = await saveMedia(f.name, Buffer.from(await f.arrayBuffer()), typeof replace === 'string' && replace ? replace : undefined);
    results.push({ original: f.name, ...r });
  }

  revalidatePath('/', 'layout');
  return Response.json({ ok: results.some((r) => r.ok), results, files: await listWithUsage() });
}

/** ?name=<file>[&force=1]. Refuses to delete a file the content still points at unless forced. */
export async function DELETE(req: Request) {
  const denied = await guard(req, { mutating: true });
  if (denied) return denied;

  const url = new URL(req.url);
  const name = validName(url.searchParams.get('name') ?? '');
  if (!name) return Response.json({ ok: false, message: 'Invalid file name.' }, { status: 400 });

  const usedBy = (await listWithUsage()).find((f) => f.name === name)?.usedBy ?? [];
  if (usedBy.length > 0 && url.searchParams.get('force') !== '1') {
    return Response.json({ ok: false, message: 'This file is still used in the content.', usedBy }, { status: 409 });
  }
  if (!(await deleteMedia(name))) return Response.json({ ok: false, message: 'File not found.' }, { status: 404 });

  revalidatePath('/', 'layout');
  return Response.json({ ok: true, files: await listWithUsage() });
}
