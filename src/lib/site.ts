import type { SiteContent } from './schema';

/** Public origin: SITE_URL env wins, then the value saved in the admin, then localhost. */
export function siteOrigin(content: SiteContent): string {
  return (process.env.SITE_URL || content.site.url || 'http://localhost:3000').replace(/\/+$/, '');
}

export const fullName = (c: SiteContent) => `${c.profile.firstName} ${c.profile.lastName}`.trim();

export const initials = (c: SiteContent) =>
  `${c.profile.firstName.charAt(0)}${c.profile.lastName.charAt(0)}`.toUpperCase() || 'RH';

export function absoluteUrl(origin: string, value: string): string {
  return /^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
}

const IMAGE_TYPES: Record<string, string> = {
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

/** MIME type guessed from a file extension, or undefined. */
export const imageType = (url: string): string | undefined => IMAGE_TYPES[url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''];

/** "2025-08" → "Aug 2025" (UTC, so server and browser always agree). */
export function formatMonth(ym: string): string {
  if (!ym) return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Whole years of total experience, counted from the job dates. Months covered by overlapping jobs
 * count once, and a job with no end date runs up to the current month, so the number grows by itself.
 */
export function experienceYears(c: Pick<SiteContent, 'experience'>, now = new Date()): number {
  const index = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return y * 12 + (m - 1);
  };
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const covered = new Set<number>();
  for (const job of c.experience) {
    const end = job.end ? index(job.end) : current;
    for (let m = index(job.start); m <= end; m++) covered.add(m);
  }
  return Math.floor(covered.size / 12);
}

/**
 * Fills in the values that are derived from the job dates, so they stay current without editing:
 *  - `{years}` inside any text becomes the total years of experience (e.g. "{years}+" → "9+")
 *  - a stat with `auto` on shows that same number
 * The admin edits the raw file, so the placeholder survives saves.
 */
export function withComputedValues(c: SiteContent, now = new Date()): SiteContent {
  const years = String(experienceYears(c, now));
  const walk = (v: unknown): unknown =>
    typeof v === 'string' ? v.replaceAll('{years}', years) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;

  const resolved = walk(c) as SiteContent;
  resolved.sections.about.stats = resolved.sections.about.stats.map((s) => (s.auto ? { ...s, value: Number(years) } : s));
  return resolved;
}

/** Human duration between two YYYY-MM values (inclusive), e.g. "1 yr 1 mo". An empty end means "until now". */
export function duration(start: string, end: string): string {
  const [sy, sm] = start.split('-').map(Number);
  const now = new Date();
  const [ey, em] = end ? end.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const months = (ey - sy) * 12 + (em - sm) + 1;
  const y = Math.floor(months / 12);
  const mo = months % 12;
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', mo ? `${mo} mo${mo > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ');
}
