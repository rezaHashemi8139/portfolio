import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Single-admin auth: a username (ADMIN_USERNAME, default "admin") and password (ADMIN_PASSWORD)
 * → a signed, expiring, httpOnly cookie. The signing key mixes in both, so changing either
 * signs every session out.
 */
export const COOKIE_NAME = 'sd_admin';
export const SESSION_SECONDS = 60 * 60 * 12;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && (process.env.SESSION_SECRET?.length ?? 0) >= 16;
}

const adminUsername = () => process.env.ADMIN_USERNAME?.trim() || 'admin';

const key = () => `${process.env.SESSION_SECRET}\u0000${adminUsername()}\u0000${process.env.ADMIN_PASSWORD}`;
const sign = (payload: string) => createHmac('sha256', key()).update(payload).digest('base64url');
const digest = (v: string) => createHash('sha256').update(v).digest();

export function credentialsMatch(username: string, password: string): boolean {
  if (!adminConfigured()) return false;
  // Both are always compared (no early exit), so timing never reveals which one was wrong.
  const userOk = timingSafeEqual(digest(username.trim()), digest(adminUsername()));
  const passOk = timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD as string));
  return userOk && passOk;
}

export function createSessionToken(): string {
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(8).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

function tokenValid(token: string | undefined): boolean {
  if (!token || !adminConfigured()) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const given = Buffer.from(token.slice(i + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(payload.split('.')[0]) > Date.now() / 1000;
}

export async function isAdmin(): Promise<boolean> {
  return tokenValid((await cookies()).get(COOKIE_NAME)?.value);
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const fetchSite = req.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none';
}

const json = (status: number, message: string) => Response.json({ ok: false, message }, { status });

/** Call first in every /api/admin handler. Returns a Response to send back, or null when allowed. */
export async function guard(req: Request, opts: { mutating: boolean }): Promise<Response | null> {
  if (!adminConfigured()) return json(503, 'Admin is not configured. Set ADMIN_PASSWORD and SESSION_SECRET.');
  if (opts.mutating && !sameOrigin(req)) return json(403, 'Cross-origin request blocked.');
  if (!(await isAdmin())) return json(401, 'Not signed in.');
  return null;
}

// ---- brute-force throttle (per process, per client address)
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

export const clientKey = (req: Request) => (req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local').trim();

export function throttled(k: string): number {
  const a = attempts.get(k);
  if (!a || a.resetAt < Date.now()) return 0;
  return a.count >= MAX_ATTEMPTS ? Math.ceil((a.resetAt - Date.now()) / 1000) : 0;
}

export function recordFailure(k: string) {
  const now = Date.now();
  const a = attempts.get(k);
  if (!a || a.resetAt < now) attempts.set(k, { count: 1, resetAt: now + WINDOW_MS });
  else a.count++;
}

export const clearFailures = (k: string) => attempts.delete(k);
