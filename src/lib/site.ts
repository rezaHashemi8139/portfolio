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
