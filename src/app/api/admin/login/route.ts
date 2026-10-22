import { cookies } from 'next/headers';
import {
  COOKIE_NAME,
  SESSION_SECONDS,
  adminConfigured,
  clearFailures,
  clientKey,
  createSessionToken,
  credentialsMatch,
  recordFailure,
  sameOrigin,
  throttled,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return Response.json(
      { ok: false, message: 'Admin is not configured. Set ADMIN_PASSWORD and SESSION_SECRET in the environment.' },
      { status: 503 },
    );
  }
  if (!sameOrigin(req)) return Response.json({ ok: false, message: 'Cross-origin request blocked.' }, { status: 403 });

  const who = clientKey(req);
  const wait = throttled(who);
  if (wait > 0) {
    return Response.json(
      { ok: false, message: `Too many attempts. Try again in ${Math.ceil(wait / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!username || !password || !credentialsMatch(username, password)) {
    recordFailure(who);
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ ok: false, message: 'Wrong username or password.' }, { status: 401 });
  }

  clearFailures(who);
  const secure = new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  (await cookies()).set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: SESSION_SECONDS,
  });
  return Response.json({ ok: true });
}
