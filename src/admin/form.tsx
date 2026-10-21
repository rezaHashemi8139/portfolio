'use client';

import { createContext, useCallback, useContext, useId, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from 'lucide-react';
import type { Issue } from './api';
import { MediaPicker } from './MediaLibrary';

/* -------------------------------------------------------------------------------------------------
 * A small schema-driven form engine. Each tab of the editor is described as data (see tabs.ts) and
 * rendered by <Fields>. Values are addressed by path, e.g. ['experience', 0, 'highlights'].
 * ----------------------------------------------------------------------------------------------- */

export type Path = (string | number)[];

export type FieldDef =
  | { type: 'text'; key: string; label: string; hint?: string; placeholder?: string; max?: number; soft?: number }
  | { type: 'textarea'; key: string; label: string; hint?: string; rows?: number; max?: number; soft?: number }
  | { type: 'number'; key: string; label: string; hint?: string }
  | { type: 'boolean'; key: string; label: string; hint?: string }
  | { type: 'select'; key: string; label: string; hint?: string; options: { value: string; label: string }[] }
  | { type: 'media'; key: string; label: string; hint?: string; kind: 'image' | 'pdf' }
  | { type: 'month'; key: string; label: string; hint?: string; optional?: boolean }
  /** string[] — `chips` renders compact tag-like inputs, otherwise one textarea per item. */
  | { type: 'strings'; key: string; label: string; hint?: string; chips?: boolean; addLabel?: string }
  | { type: 'group'; key?: string; label: string; hint?: string; fields: FieldDef[] }
  | {
      type: 'array';
      key: string;
      label: string;
      hint?: string;
      itemTitle: (item: Record<string, unknown>, index: number) => string;
      fields: FieldDef[];
      blank: () => Record<string, unknown>;
      addLabel?: string;
      /** First item opens expanded. */
      openFirst?: boolean;
    };

interface FormApi {
  get: (path: Path) => unknown;
  set: (path: Path, value: unknown) => void;
  errors: (path: Path) => string[];
}

const FormContext = createContext<FormApi | null>(null);

export function FormProvider({ root, onChange, issues, children }: { root: unknown; onChange: (next: unknown) => void; issues: Issue[]; children: ReactNode }) {
  const get = useCallback((path: Path) => path.reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), root), [root]);
  const set = useCallback((path: Path, value: unknown) => onChange(setIn(root, path, value)), [root, onChange]);
  const errors = useCallback((path: Path) => issues.filter((i) => i.path === path.join('.')).map((i) => i.message), [issues]);
  return <FormContext.Provider value={{ get, set, errors }}>{children}</FormContext.Provider>;
}

const useForm = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('Form primitives must be rendered inside <FormProvider>');
  return ctx;
};

/** Immutable deep set. */
export function setIn(root: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const copy: unknown = Array.isArray(root) ? [...root] : { ...(root as object) };
  (copy as Record<string | number, unknown>)[head] = setIn((root as Record<string | number, unknown> | undefined)?.[head], rest, value);
  return copy;
}

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/* ----------------------------------------------------------------------------------- field shell */

function Shell({ id, label, hint, errors, children, counter }: { id: string; label: string; hint?: string; errors: string[]; children: ReactNode; counter?: ReactNode }) {
  return (
    <div className={`field ${errors.length ? 'has-error' : ''}`}>
      <div className="field__top">
        <label htmlFor={id}>{label}</label>
        {counter}
      </div>
      {children}
      {hint ? <p className="field__hint">{hint}</p> : null}
      {errors.map((e) => (
        <p key={e} className="field__error" role="alert">
          {e}
        </p>
      ))}
    </div>
  );
}

function Counter({ value, soft, max }: { value: string; soft?: number; max?: number }) {
  if (!soft && !max) return null;
  const over = (soft && value.length > soft) || (max && value.length > max);
  return (
    <span className={`counter ${over ? 'is-over' : ''}`} aria-hidden="true">
      {value.length}
      {soft ? ` / ~${soft}` : max ? ` / ${max}` : ''}
    </span>
  );
}

/* ------------------------------------------------------------------------------------ primitives */

function TextField({ def, path }: { def: Extract<FieldDef, { type: 'text' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  const value = asString(f.get(path));
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)} counter={<Counter value={value} soft={def.soft} />}>
      <input id={id} type="text" value={value} placeholder={def.placeholder} maxLength={def.max} onChange={(e) => f.set(path, e.target.value)} />
    </Shell>
  );
}

function TextAreaField({ def, path }: { def: Extract<FieldDef, { type: 'textarea' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  const value = asString(f.get(path));
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)} counter={<Counter value={value} soft={def.soft} />}>
      <textarea id={id} rows={def.rows ?? 4} value={value} maxLength={def.max} onChange={(e) => f.set(path, e.target.value)} />
    </Shell>
  );
}

function NumberField({ def, path }: { def: Extract<FieldDef, { type: 'number' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  const raw = f.get(path);
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)}>
      <input
        id={id}
        type="number"
        min={0}
        step={1}
        value={typeof raw === 'number' ? raw : ''}
        onChange={(e) => f.set(path, e.target.value === '' ? 0 : Math.max(0, Math.round(Number(e.target.value))))}
      />
    </Shell>
  );
}

function BooleanField({ def, path }: { def: Extract<FieldDef, { type: 'boolean' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  return (
    <div className="field field--check">
      <label htmlFor={id}>
        <input id={id} type="checkbox" checked={f.get(path) === true} onChange={(e) => f.set(path, e.target.checked)} />
        <span>{def.label}</span>
      </label>
      {def.hint ? <p className="field__hint">{def.hint}</p> : null}
    </div>
  );
}

function SelectField({ def, path }: { def: Extract<FieldDef, { type: 'select' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)}>
      <select id={id} value={asString(f.get(path))} onChange={(e) => f.set(path, e.target.value)}>
        {def.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

function MonthField({ def, path }: { def: Extract<FieldDef, { type: 'month' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  const value = asString(f.get(path));
  const current = Boolean(def.optional) && value === '';
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)}>
      <div className="row">
        <input id={id} type="month" value={value} disabled={current} onChange={(e) => f.set(path, e.target.value)} />
        {def.optional ? (
          <label className="inline-check">
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => f.set(path, e.target.checked ? '' : new Date().toISOString().slice(0, 7))}
            />
            <span>Present</span>
          </label>
        ) : null}
      </div>
    </Shell>
  );
}

function MediaField({ def, path }: { def: Extract<FieldDef, { type: 'media' }>; path: Path }) {
  const f = useForm();
  const id = useId();
  const [picking, setPicking] = useState(false);
  const value = asString(f.get(path));
  const isImage = def.kind === 'image';
  return (
    <Shell id={id} label={def.label} hint={def.hint} errors={f.errors(path)}>
      <div className="media-field">
        <div className="media-field__preview" aria-hidden="true">
          {value && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" />
          ) : (
            <span>{value ? 'PDF' : '—'}</span>
          )}
        </div>
        <div className="media-field__body">
          <input id={id} type="text" value={value} placeholder="/media/… or https://…" onChange={(e) => f.set(path, e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn--sm" onClick={() => setPicking(true)}>
              Choose / upload…
            </button>
            {value ? (
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => f.set(path, '')}>
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {picking ? (
        <MediaPicker
          kind={def.kind}
          current={value}
          onClose={() => setPicking(false)}
          onPick={(url) => {
            f.set(path, url);
            setPicking(false);
          }}
        />
      ) : null}
    </Shell>
  );
}

function StringsField({ def, path }: { def: Extract<FieldDef, { type: 'strings' }>; path: Path }) {
  const f = useForm();
  const baseId = useId();
  const items = asArray(f.get(path)).map(asString);
  const [draft, setDraft] = useState('');

  const commit = (next: string[]) => f.set(path, next);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const add = (text: string) => {
    const parts = def.chips ? text.split(',').map((t) => t.trim()).filter(Boolean) : [text];
    if (parts.length) commit([...items, ...parts]);
  };

  return (
    <Shell id={`${baseId}-new`} label={def.label} hint={def.hint} errors={[...f.errors(path), ...items.flatMap((_, i) => f.errors([...path, i]))]}>
      {def.chips ? (
        <div className="chips-edit">
          {items.map((item, i) => (
            <span className="chip-edit" key={i}>
              <input
                aria-label={`${def.label} ${i + 1}`}
                value={item}
                size={Math.max(4, item.length + 1)}
                onChange={(e) => commit(items.map((x, k) => (k === i ? e.target.value : x)))}
              />
              <button type="button" aria-label={`Remove ${item || 'item'}`} onClick={() => commit(items.filter((_, k) => k !== i))}>
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id={`${baseId}-new`}
            className="chip-new"
            value={draft}
            placeholder={def.addLabel ?? 'Add… (Enter or comma)'}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(',')) {
                add(v);
                setDraft('');
              } else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (draft.trim()) add(draft);
                setDraft('');
              } else if (e.key === 'Backspace' && !draft && items.length) {
                commit(items.slice(0, -1));
              }
            }}
            onBlur={() => {
              if (draft.trim()) add(draft);
              setDraft('');
            }}
          />
        </div>
      ) : (
        <div className="list-edit">
          {items.map((item, i) => (
            <div className="list-edit__row" key={i}>
              <textarea
                aria-label={`${def.label} ${i + 1}`}
                rows={Math.min(8, Math.max(2, Math.ceil(item.length / 90)))}
                value={item}
                onChange={(e) => commit(items.map((x, k) => (k === i ? e.target.value : x)))}
              />
              <div className="icon-row">
                <button type="button" className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn icon-btn--danger" aria-label="Remove" onClick={() => commit(items.filter((_, k) => k !== i))}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          <button id={`${baseId}-new`} type="button" className="btn btn--sm" onClick={() => commit([...items, ''])}>
            <Plus aria-hidden="true" /> {def.addLabel ?? 'Add'}
          </button>
        </div>
      )}
    </Shell>
  );
}

function ArrayField({ def, path }: { def: Extract<FieldDef, { type: 'array' }>; path: Path }) {
  const f = useForm();
  const items = asArray(f.get(path)) as Record<string, unknown>[];
  const commit = (next: unknown[]) => f.set(path, next);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  // Remember which cards are open by position; new items open automatically.
  const [open, setOpen] = useState<Record<number, boolean>>(() => (def.openFirst ? { 0: true } : ({} as Record<number, boolean>)));

  return (
    <fieldset className="array">
      <legend>
        {def.label} <span className="array__count">{items.length}</span>
      </legend>
      {def.hint ? <p className="field__hint">{def.hint}</p> : null}
      {f.errors(path).map((e) => (
        <p key={e} className="field__error" role="alert">
          {e}
        </p>
      ))}
      {items.map((item, i) => (
        <details
          className="card"
          key={i}
          open={open[i] === true}
          onToggle={(e) => {
            const isOpen = (e.currentTarget as HTMLDetailsElement).open;
            setOpen((o) => (o[i] === isOpen ? o : { ...o, [i]: isOpen }));
          }}
        >
          <summary>
            <span className="card__title">{def.itemTitle(item, i) || `Item ${i + 1}`}</span>
            <span className="icon-row" onClick={(e) => e.preventDefault()}>
              <button type="button" className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp aria-hidden="true" />
              </button>
              <button type="button" className="icon-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Duplicate"
                onClick={() => commit([...items.slice(0, i + 1), structuredClone(item), ...items.slice(i + 1)])}
              >
                <Copy aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label="Delete"
                onClick={() => {
                  if (window.confirm(`Delete “${def.itemTitle(item, i) || `item ${i + 1}`}”?`)) commit(items.filter((_, k) => k !== i));
                }}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </span>
          </summary>
          <div className="card__body">
            <Fields defs={def.fields} base={[...path, i]} />
          </div>
        </details>
      ))}
      <button
        type="button"
        className="btn btn--sm"
        onClick={() => {
          setOpen((o) => ({ ...o, [items.length]: true }));
          commit([...items, def.blank()]);
        }}
      >
        <Plus aria-hidden="true" /> {def.addLabel ?? `Add ${def.label.toLowerCase().replace(/s$/, '')}`}
      </button>
    </fieldset>
  );
}

/* --------------------------------------------------------------------------------------- renderer */

export function Fields({ defs, base }: { defs: FieldDef[]; base: Path }) {
  return (
    <>
      {defs.map((def, i) => {
        const path = def.type === 'group' ? (def.key ? [...base, def.key] : base) : [...base, def.key];
        switch (def.type) {
          case 'text':
            return <TextField key={i} def={def} path={path} />;
          case 'textarea':
            return <TextAreaField key={i} def={def} path={path} />;
          case 'number':
            return <NumberField key={i} def={def} path={path} />;
          case 'boolean':
            return <BooleanField key={i} def={def} path={path} />;
          case 'select':
            return <SelectField key={i} def={def} path={path} />;
          case 'media':
            return <MediaField key={i} def={def} path={path} />;
          case 'month':
            return <MonthField key={i} def={def} path={path} />;
          case 'strings':
            return <StringsField key={i} def={def} path={path} />;
          case 'array':
            return <ArrayField key={i} def={def} path={path} />;
          case 'group':
            return (
              <section className="group" key={i}>
                <h3>{def.label}</h3>
                {def.hint ? <p className="field__hint">{def.hint}</p> : null}
                <Fields defs={def.fields} base={path} />
              </section>
            );
        }
      })}
    </>
  );
}
