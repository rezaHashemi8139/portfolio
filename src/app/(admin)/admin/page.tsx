import { redirect } from 'next/navigation';
import { adminConfigured, isAdmin } from '@/lib/auth';
import { ContentError, readContentForAdmin } from '@/lib/content';
import { Editor } from '@/admin/Editor';
import { SetupNotice } from '@/admin/SetupNotice';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    return { ok: true as const, ...(await readContentForAdmin()) };
  } catch (e) {
    return { ok: false as const, message: e instanceof ContentError ? e.message : 'content/site.json could not be read.' };
  }
}

export default async function AdminPage() {
  if (!adminConfigured()) return <SetupNotice />;
  if (!(await isAdmin())) redirect('/admin/login');

  const loaded = await load();
  if (loaded.ok) return <Editor initialContent={loaded.content} initialEtag={loaded.etag} />;

  return (
    <div className="login">
      <div className="login__card">
        <h1>Content file problem</h1>
        <p className="field__error">{loaded.message}</p>
        <p className="field__hint">
          Fix <code>content/site.json</code> on the server, or restore a copy from <code>content/backups/</code>, then reload this page.
        </p>
      </div>
    </div>
  );
}
