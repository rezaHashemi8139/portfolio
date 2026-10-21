import { cookies } from 'next/headers';
import { COOKIE_NAME, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: 'Cross-origin request blocked.' }, { status: 403 });
  (await cookies()).delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
