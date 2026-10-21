import 'server-only';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { contentSchema, formatIssues, type SiteContent } from './schema';

/**
 * File-backed "CMS". Everything editable lives under CONTENT_DIR (default ./content):
 *   site.json   – all text/data   uploads/ – images & PDFs   backups/ – automatic snapshots
 * There is no database; the admin just rewrites these files and revalidates the pages.
 */
export const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'content'));
export const CONTENT_FILE = path.join(CONTENT_DIR, 'site.json');
export const UPLOADS_DIR = path.join(CONTENT_DIR, 'uploads');
export const BACKUPS_DIR = path.join(CONTENT_DIR, 'backups');

const MAX_BACKUPS = 40;

export type Issue = { path: string; message: string };

export class ContentError extends Error {
  constructor(
    message: string,
    readonly issues: Issue[] = [],
  ) {
    super(message);
  }
}

export const etagOf = (raw: string) => createHash('sha256').update(raw).digest('hex').slice(0, 16);

function parseRaw(raw: string): SiteContent {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new ContentError(`content/site.json is not valid JSON: ${(e as Error).message}`);
  }
  const result = contentSchema.safeParse(json);
  if (!result.success) {
    const issues = formatIssues(result.error);
    throw new ContentError(`content/site.json failed validation: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`, issues);
  }
  return result.data;
}

/** Cached per request, so generateMetadata + the page share one read. */
export const getContent = cache(async (): Promise<SiteContent> => parseRaw(await fs.readFile(CONTENT_FILE, 'utf8')));

/** Uncached read for the admin: also returns the version tag used for conflict detection. */
export async function readContentForAdmin(): Promise<{ content: SiteContent; etag: string }> {
  const raw = await fs.readFile(CONTENT_FILE, 'utf8');
  return { content: parseRaw(raw), etag: etagOf(raw) };
}

// ---- writes are serialised so two saves can never interleave
let chain: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

async function atomicWrite(file: string, data: string | Buffer) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

async function snapshot(raw: string) {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await atomicWrite(path.join(BACKUPS_DIR, `site-${stamp}.json`), raw);
  const files = (await fs.readdir(BACKUPS_DIR)).filter((f) => /^site-.*\.json$/.test(f)).sort();
  await Promise.all(files.slice(0, Math.max(0, files.length - MAX_BACKUPS)).map((f) => fs.unlink(path.join(BACKUPS_DIR, f)).catch(() => undefined)));
}

export type SaveResult =
  | { ok: true; content: SiteContent; etag: string }
  | { ok: false; status: 400 | 409; message: string; issues: Issue[] };

/** Validate → snapshot the previous version → atomically replace site.json. */
export function saveContent(input: unknown, baseEtag?: string): Promise<SaveResult> {
  return exclusive(async () => {
    const current = await fs.readFile(CONTENT_FILE, 'utf8');
    if (baseEtag && baseEtag !== etagOf(current)) {
      return { ok: false, status: 409, message: 'site.json was changed since you opened the editor. Reload to get the latest version.', issues: [] };
    }
    const candidate = input && typeof input === 'object' ? { ...(input as object), updatedAt: new Date().toISOString() } : input;
    const parsed = contentSchema.safeParse(candidate);
    if (!parsed.success) {
      return { ok: false, status: 400, message: 'Some fields are invalid.', issues: formatIssues(parsed.error) };
    }
    const next = JSON.stringify(parsed.data, null, 2) + '\n';
    await snapshot(current);
    await atomicWrite(CONTENT_FILE, next);
    return { ok: true, content: parsed.data, etag: etagOf(next) };
  });
}

// ---- backups
export type BackupInfo = { name: string; size: number; savedAt: string };

const BACKUP_RE = /^site-[0-9TZ-]+\.json$/;

export async function listBackups(): Promise<BackupInfo[]> {
  try {
    const names = (await fs.readdir(BACKUPS_DIR)).filter((f) => BACKUP_RE.test(f)).sort().reverse();
    return await Promise.all(
      names.map(async (name) => {
        const st = await fs.stat(path.join(BACKUPS_DIR, name));
        return { name, size: st.size, savedAt: st.mtime.toISOString() };
      }),
    );
  } catch {
    return [];
  }
}

export async function readBackup(name: string): Promise<SiteContent | null> {
  if (!BACKUP_RE.test(name)) return null;
  try {
    return parseRaw(await fs.readFile(path.join(BACKUPS_DIR, name), 'utf8'));
  } catch {
    return null;
  }
}

/** Every `/media/<file>` referenced anywhere in the content, mapped to the JSON paths using it. */
export function mediaUsages(content: SiteContent): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (v: unknown, trail: string) => {
    if (typeof v === 'string') {
      if (v.startsWith('/media/')) found.set(v, [...(found.get(v) ?? []), trail]);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${trail}.${i}`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, trail ? `${trail}.${k}` : k);
  };
  walk(content, '');
  return found;
}
