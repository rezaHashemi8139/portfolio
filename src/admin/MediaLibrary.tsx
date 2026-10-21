'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ClipboardCopy, FileText, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { api, formatBytes, type MediaItem } from './api';

type Kind = 'image' | 'pdf' | 'any';

interface LibraryProps {
  kind?: Kind;
  /** When set, cards get a “Use this file” button instead of being read-only browsing. */
  onPick?: (url: string) => void;
  current?: string;
}

const ACCEPT: Record<Kind, string> = {
  image: 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,.ico',
  pdf: 'application/pdf',
  any: 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,.ico,application/pdf',
};

export function MediaLibrary({ kind = 'any', onPick, current }: LibraryProps) {
  const [files, setFiles] = useState<MediaItem[] | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pickInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await api<{ files: MediaItem[] }>('/api/admin/media');
    if (res.ok) setFiles(res.files);
    else setNotice({ tone: 'error', text: res.message });
  }, []);

  useEffect(() => {
    let alive = true;
    void api<{ files: MediaItem[] }>('/api/admin/media').then((res) => {
      if (!alive) return;
      if (res.ok) setFiles(res.files);
      else setNotice({ tone: 'error', text: res.message });
    });
    return () => {
      alive = false;
    };
  }, []);

  const upload = async (list: File[], replace?: string) => {
    if (list.length === 0) return;
    setBusy(true);
    setNotice(null);
    const form = new FormData();
    list.forEach((f) => form.append('files', f));
    if (replace) form.append('replace', replace);
    const res = await api<{ files: MediaItem[]; results: ({ original: string } & ({ ok: true; file: string } | { ok: false; message: string }))[] }>(
      '/api/admin/media',
      { method: 'POST', body: form },
    );
    setBusy(false);
    if (!res.ok) {
      setNotice({ tone: 'error', text: res.message });
      return;
    }
    setFiles(res.files);
    const failed = res.results.filter((r) => !r.ok) as { original: string; message: string }[];
    const done = res.results.length - failed.length;
    if (failed.length) setNotice({ tone: 'error', text: failed.map((f) => `${f.original}: ${f.message}`).join(' · ') });
    else setNotice({ tone: 'ok', text: replace ? `Replaced ${replace}.` : `Uploaded ${done} file${done > 1 ? 's' : ''}.` });
  };

  const remove = async (f: MediaItem) => {
    if (!window.confirm(`Delete ${f.name}? This cannot be undone.`)) return;
    let res = await api<{ files: MediaItem[] }>(`/api/admin/media?name=${encodeURIComponent(f.name)}`, { method: 'DELETE' });
    if (!res.ok && res.status === 409 && res.usedBy) {
      const where = res.usedBy.map((p) => `• ${p}`).join('\n');
      if (!window.confirm(`${f.name} is still used here:\n${where}\n\nDelete it anyway? Those fields will point to a missing file until you change them.`)) return;
      res = await api<{ files: MediaItem[] }>(`/api/admin/media?name=${encodeURIComponent(f.name)}&force=1`, { method: 'DELETE' });
    }
    if (res.ok) {
      setFiles(res.files);
      setNotice({ tone: 'ok', text: `Deleted ${f.name}.` });
    } else setNotice({ tone: 'error', text: res.message });
  };

  const copy = async (f: MediaItem) => {
    try {
      await navigator.clipboard.writeText(f.url);
      setNotice({ tone: 'ok', text: `Copied ${f.url}` });
    } catch {
      setNotice({ tone: 'error', text: `Copy failed — the path is ${f.url}` });
    }
  };

  const visible = (files ?? []).filter((f) => kind === 'any' || f.kind === kind);

  return (
    <div className="media">
      <div
        className={`dropzone ${dragging ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
      >
        <Upload aria-hidden="true" />
        <p>
          Drop files here, or{' '}
          <button type="button" className="link" onClick={() => pickInput.current?.click()}>
            browse
          </button>
        </p>
        <small>Images (JPG, PNG, WebP, AVIF, GIF, SVG, ICO) and PDF · up to 12 MB each</small>
        <input
          ref={pickInput}
          type="file"
          hidden
          multiple
          accept={ACCEPT[kind]}
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>

      <div className="media__bar">
        <span>{files ? `${visible.length} file${visible.length === 1 ? '' : 's'}` : 'Loading…'}</span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw aria-hidden="true" /> Refresh
        </button>
      </div>

      {busy ? <p className="notice" role="status">Working…</p> : null}
      {notice ? (
        <p className={`notice notice--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
          {notice.text}
        </p>
      ) : null}

      <ul className="media__grid">
        {visible.map((f) => (
          <li key={f.name} className={`media-card ${current === f.url ? 'is-current' : ''}`}>
            <a className="media-card__thumb" href={f.url} target="_blank" rel="noreferrer" title="Open in a new tab">
              {f.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${f.url}?v=${encodeURIComponent(f.modifiedAt)}`} alt="" loading="lazy" />
              ) : (
                <FileText aria-hidden="true" />
              )}
            </a>
            <div className="media-card__meta">
              <b title={f.name}>{f.name}</b>
              <span>
                {formatBytes(f.size)} · {new Date(f.modifiedAt).toLocaleDateString()}
              </span>
              {f.usedBy.length > 0 ? (
                <span className="badge" title={f.usedBy.join('\n')}>
                  used in {f.usedBy.length}
                </span>
              ) : (
                <span className="badge badge--muted">unused</span>
              )}
            </div>
            <div className="media-card__actions">
              {onPick ? (
                <button type="button" className="btn btn--sm btn--primary" onClick={() => onPick(f.url)}>
                  {current === f.url ? <Check aria-hidden="true" /> : null} Use this file
                </button>
              ) : null}
              <button type="button" className="icon-btn" aria-label={`Copy URL of ${f.name}`} title="Copy URL" onClick={() => void copy(f)}>
                <ClipboardCopy aria-hidden="true" />
              </button>
              <ReplaceButton file={f} onFile={(file) => void upload([file], f.name)} />
              <button type="button" className="icon-btn icon-btn--danger" aria-label={`Delete ${f.name}`} title="Delete" onClick={() => void remove(f)}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {files && visible.length === 0 ? <p className="empty">No files yet — upload one above.</p> : null}
    </div>
  );
}

function ReplaceButton({ file, onFile }: { file: MediaItem; onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className="icon-btn" aria-label={`Replace ${file.name} with a new file`} title="Replace with a new file (keeps the same URL)" onClick={() => input.current?.click()}>
        <RefreshCw aria-hidden="true" />
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept={file.kind === 'pdf' ? 'application/pdf' : `.${file.name.split('.').pop()}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

/** Modal wrapper (native <dialog>: focus trap and Esc come for free). */
export function MediaPicker({ kind, current, onPick, onClose }: { kind: Kind; current?: string; onPick: (url: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="modal__head">
        <h2>Choose a {kind === 'pdf' ? 'PDF' : kind === 'image' ? 'image' : 'file'}</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="modal__body">
        <MediaLibrary kind={kind} current={current} onPick={onPick} />
      </div>
    </dialog>
  );
}
