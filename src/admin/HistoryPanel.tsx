'use client';

import { useEffect, useState } from 'react';
import type { SiteContent } from '@/lib/schema';
import { api, formatBytes } from './api';

type Backup = { name: string; size: number; savedAt: string };

/** Every save keeps a snapshot of the version it replaced (latest 40). */
export function HistoryPanel({ onLoad }: { onLoad: (content: SiteContent) => void }) {
  const [backups, setBackups] = useState<Backup[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void api<{ backups: Backup[] }>('/api/admin/backups').then((res) => {
      if (!alive) return;
      if (res.ok) setBackups(res.backups);
      else setError(res.message);
    });
    return () => {
      alive = false;
    };
  }, []);

  const load = async (name: string) => {
    const res = await api<{ content: SiteContent }>(`/api/admin/backups?name=${encodeURIComponent(name)}`);
    if (res.ok) onLoad(res.content);
    else setError(res.message);
  };

  return (
    <section className="panel">
      <p className="field__hint">
        Each time you save, the previous version is kept here. Loading one puts it into the editor — nothing changes on the live site until you
        press <b>Save &amp; publish</b>.
      </p>
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
      {backups === null && !error ? <p>Loading…</p> : null}
      {backups && backups.length === 0 ? <p className="empty">No earlier versions yet — they appear after your first save.</p> : null}
      <ul className="history">
        {(backups ?? []).map((b) => (
          <li key={b.name}>
            <div>
              <b>{new Date(b.savedAt).toLocaleString()}</b>
              <span>
                {b.name} · {formatBytes(b.size)}
              </span>
            </div>
            <button type="button" className="btn btn--sm" onClick={() => void load(b.name)}>
              Load into editor
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
