import { guard } from '@/lib/auth';
import { listBackups, readBackup } from '@/lib/content';

export const dynamic = 'force-dynamic';

/** No `name` → list of snapshots. With `?name=` → that snapshot's content (to load into the editor). */
export async function GET(req: Request) {
  const denied = await guard(req, { mutating: false });
  if (denied) return denied;

  const name = new URL(req.url).searchParams.get('name');
  if (!name) return Response.json({ ok: true, backups: await listBackups() });

  const content = await readBackup(name);
  if (!content) return Response.json({ ok: false, message: 'Backup not found or invalid.' }, { status: 404 });
  return Response.json({ ok: true, content });
}
