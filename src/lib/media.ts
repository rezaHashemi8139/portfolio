import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from './content';

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
};

const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,119}$/;

export const extOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase();

/** A file name that is safe to use on disk and in a URL, or null. */
export function validName(name: string): string | null {
  return NAME_RE.test(name) && extOf(name) in MIME && !name.includes('..') ? name : null;
}

export function slugifyName(original: string): string {
  const ext = extOf(original);
  const base = original
    .slice(0, original.lastIndexOf('.') >= 0 ? original.lastIndexOf('.') : undefined)
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'file'}.${ext}`;
}

export function filePath(name: string): string | null {
  const ok = validName(name);
  if (!ok) return null;
  const full = path.join(UPLOADS_DIR, ok);
  return full.startsWith(UPLOADS_DIR + path.sep) ? full : null;
}

const startsWith = (buf: Buffer, bytes: number[], at = 0) => bytes.every((b, i) => buf[at + i] === b);

/** Do the first bytes match what the extension claims? Stops e.g. an .exe renamed to .jpg. */
export function matchesType(ext: string, buf: Buffer): boolean {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return startsWith(buf, [0xff, 0xd8, 0xff]);
    case 'png':
      return startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'gif':
      return buf.subarray(0, 4).toString('latin1') === 'GIF8';
    case 'webp':
      return buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP';
    case 'avif':
      return buf.subarray(4, 8).toString('latin1') === 'ftyp' && /avif|avis/.test(buf.subarray(8, 32).toString('latin1'));
    case 'pdf':
      return buf.subarray(0, 5).toString('latin1') === '%PDF-';
    case 'ico':
      return startsWith(buf, [0, 0, 1, 0]);
    case 'svg': {
      const head = buf.toString('utf8');
      return /<svg[\s>]/i.test(head) && !/<script|\son\w+\s*=|javascript:/i.test(head);
    }
    default:
      return false;
  }
}

export type MediaFile = { name: string; url: string; size: number; modifiedAt: string; type: string; kind: 'image' | 'pdf' };

export async function listMedia(): Promise<MediaFile[]> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const names = await fs.readdir(UPLOADS_DIR);
  const files = await Promise.all(
    names.filter((n) => validName(n)).map(async (name) => {
      const st = await fs.stat(path.join(UPLOADS_DIR, name));
      const ext = extOf(name);
      return {
        name,
        url: `/media/${name}`,
        size: st.size,
        modifiedAt: st.mtime.toISOString(),
        type: MIME[ext],
        kind: ext === 'pdf' ? 'pdf' : 'image',
      } satisfies MediaFile;
    }),
  );
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

async function exists(p: string) {
  return fs.access(p).then(
    () => true,
    () => false,
  );
}

export type SaveMediaResult = { ok: true; file: string } | { ok: false; message: string };

/** Store an upload. With `replace`, overwrites that exact file so existing links keep working. */
export async function saveMedia(original: string, data: Buffer, replace?: string): Promise<SaveMediaResult> {
  if (data.length === 0) return { ok: false, message: 'The file is empty.' };
  if (data.length > MAX_UPLOAD_BYTES) return { ok: false, message: `Too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` };

  let name: string;
  if (replace) {
    const target = validName(replace);
    if (!target) return { ok: false, message: 'Invalid file to replace.' };
    if (extOf(original) !== extOf(target) && !(['jpg', 'jpeg'].includes(extOf(original)) && ['jpg', 'jpeg'].includes(extOf(target)))) {
      return { ok: false, message: `Replacement must be a .${extOf(target)} file so the existing links keep working.` };
    }
    if (!(await exists(path.join(UPLOADS_DIR, target)))) return { ok: false, message: `${target} does not exist, so there is nothing to replace.` };
    name = target;
  } else {
    name = slugifyName(original);
    if (!(extOf(name) in MIME)) return { ok: false, message: `Unsupported type .${extOf(name)}. Allowed: ${Object.keys(MIME).join(', ')}.` };
  }

  if (!matchesType(extOf(name), data)) return { ok: false, message: 'The file content does not match its extension.' };

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  if (!replace) {
    const ext = extOf(name);
    const stem = name.slice(0, -(ext.length + 1));
    for (let n = 2; await exists(path.join(UPLOADS_DIR, name)); n++) name = `${stem}-${n}.${ext}`;
  }
  const full = path.join(UPLOADS_DIR, name);
  const tmp = `${full}.${process.pid}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, full);
  return { ok: true, file: name };
}

export async function deleteMedia(name: string): Promise<boolean> {
  const full = filePath(name);
  if (!full) return false;
  try {
    await fs.unlink(full);
    return true;
  } catch {
    return false;
  }
}
