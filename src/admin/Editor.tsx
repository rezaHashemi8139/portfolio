'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, History as HistoryIcon, Image as ImageIcon, LogOut, Save, Braces } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { api, json, type Issue } from './api';
import { FormProvider, Fields } from './form';
import { TABS, tabForPath } from './tabs';
import { MediaLibrary } from './MediaLibrary';
import { RawJson } from './RawJson';
import { HistoryPanel } from './HistoryPanel';

interface Props {
  initialContent: SiteContent;
  initialEtag: string;
}

type Toast = { tone: 'ok' | 'error'; text: string; conflict?: boolean } | null;

const EXTRA_TABS = [
  { id: 'media', label: 'Files & images', icon: ImageIcon },
  { id: 'json', label: 'Raw JSON', icon: Braces },
  { id: 'history', label: 'History', icon: HistoryIcon },
] as const;

export function Editor({ initialContent, initialEtag }: Props) {
  const [draft, setDraft] = useState<SiteContent>(initialContent);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialContent));
  const [etag, setEtag] = useState(initialEtag);
  const [tab, setTab] = useState<string>('general');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== savedJson, [draft, savedJson]);

  const save = useCallback(async () => {
    setSaving(true);
    setToast(null);
    const res = await api<{ content: SiteContent; etag: string }>('/api/admin/content', json('PUT', { content: draft, baseEtag: etag }));
    setSaving(false);
    if (res.ok) {
      setDraft(res.content);
      setSavedJson(JSON.stringify(res.content));
      setEtag(res.etag);
      setIssues([]);
      setToast({ tone: 'ok', text: 'Saved. The public site is being rebuilt with your changes.' });
    } else {
      setIssues(res.issues ?? []);
      setToast({ tone: 'error', text: res.message, conflict: res.status === 409 });
    }
  }, [draft, etag]);

  // Ctrl/⌘+S saves.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Success messages fade away on their own.
  useEffect(() => {
    if (toast?.tone !== 'ok') return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const reloadLatest = async () => {
    if (dirty && !window.confirm('Discard your unsaved edits and load the latest saved version?')) return;
    const res = await api<{ content: SiteContent; etag: string }>('/api/admin/content');
    if (!res.ok) {
      setToast({ tone: 'error', text: res.message });
      return;
    }
    setDraft(res.content);
    setSavedJson(JSON.stringify(res.content));
    setEtag(res.etag);
    setIssues([]);
    setToast({ tone: 'ok', text: 'Loaded the latest saved version.' });
  };

  const logout = async () => {
    if (dirty && !window.confirm('You have unsaved changes. Log out anyway?')) return;
    await api('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formTab = TABS.find((t) => t.id === tab);
  const errorCount = (id: string) => issues.filter((i) => tabForPath(i.path) === id).length;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__title">
          <h1>Site editor</h1>
          <span className={`state ${dirty ? 'is-dirty' : ''}`} role="status">
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
        <div className="topbar__actions">
          <a className="btn btn--ghost" href="/" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" /> View site
          </a>
          <button type="button" className="btn btn--ghost" onClick={download} title="Download the current content as site.json">
            <Download aria-hidden="true" /> <span className="hide-sm">Export</span>
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={saving || !dirty} title="Ctrl/⌘ + S">
            <Save aria-hidden="true" /> {saving ? 'Saving…' : 'Save & publish'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void logout()}>
            <LogOut aria-hidden="true" /> <span className="hide-sm">Log out</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => {
            const n = errorCount(t.id);
            return (
              <button key={t.id} type="button" className={`tab ${tab === t.id ? 'is-active' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
                {t.label}
                {n > 0 ? <span className="tab__err" aria-label={`${n} errors`}>{n}</span> : null}
              </button>
            );
          })}
          <hr />
          {EXTRA_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`tab ${tab === id ? 'is-active' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        <main className="content">
          {toast ? (
            <div className={`banner banner--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
              {toast.tone === 'ok' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              <div>
                <p>{toast.text}</p>
                {toast.conflict ? (
                  <button type="button" className="btn btn--sm" onClick={() => void reloadLatest()}>
                    Load the latest version
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {issues.length > 0 ? (
            <div className="banner banner--error" role="alert">
              <AlertTriangle aria-hidden="true" />
              <div>
                <p>
                  <b>{issues.length} field{issues.length > 1 ? 's need' : ' needs'} attention</b> — nothing was saved.
                </p>
                <ul className="issues">
                  {issues.slice(0, 12).map((i) => (
                    <li key={`${i.path}-${i.message}`}>
                      <button type="button" className="link" onClick={() => setTab(tabForPath(i.path))}>
                        {i.path || 'content'}
                      </button>
                      : {i.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {formTab ? (
            <FormProvider root={draft} onChange={(n) => setDraft(n as SiteContent)} issues={issues}>
              <h2 className="page-title">{formTab.label}</h2>
              {formTab.blocks.map((b, i) => (
                <section className="panel" key={`${formTab.id}-${i}`}>
                  {b.title ? <h3>{b.title}</h3> : null}
                  {b.hint ? <p className="field__hint">{b.hint}</p> : null}
                  <Fields defs={b.fields} base={b.base} />
                </section>
              ))}
            </FormProvider>
          ) : null}

          {tab === 'media' ? (
            <>
              <h2 className="page-title">Files & images</h2>
              <section className="panel">
                <p className="field__hint">
                  Everything uploaded here is stored on the server and can be used from any image or file field. Changes to files apply
                  immediately — they do not need “Save & publish”.
                </p>
                <MediaLibrary />
              </section>
            </>
          ) : null}

          {tab === 'json' ? (
            <>
              <h2 className="page-title">Raw JSON</h2>
              <RawJson
                value={draft}
                onApply={(next) => {
                  setDraft(next);
                  setToast({ tone: 'ok', text: 'Applied to the form. Review it, then press Save & publish.' });
                }}
              />
            </>
          ) : null}

          {tab === 'history' ? (
            <>
              <h2 className="page-title">History</h2>
              <HistoryPanel
                onLoad={(content) => {
                  setDraft(content);
                  setTab('general');
                  setToast({ tone: 'ok', text: 'Older version loaded into the editor. Press Save & publish to restore it.' });
                }}
              />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
