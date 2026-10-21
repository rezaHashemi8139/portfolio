'use client';

import { useState } from 'react';
import type { SiteContent } from '@/lib/schema';

/** Direct JSON editing. Parsing is checked here; the full schema is enforced by the server on save. */
export function RawJson({ value, onApply }: { value: SiteContent; onApply: (next: SiteContent) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');

  const apply = () => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The top level must be a JSON object.');
      setError('');
      onApply(parsed as SiteContent);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel">
      <p className="field__hint">
        This is the exact content of <code>content/site.json</code>. Edit it here, press <b>Apply to form</b>, check the other tabs, then{' '}
        <b>Save &amp; publish</b>. Invalid values are rejected on save and listed by field.
      </p>
      <textarea
        className="code"
        aria-label="site.json"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError('');
        }}
      />
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row">
        <button type="button" className="btn btn--primary" onClick={apply}>
          Apply to form
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setText(JSON.stringify(value, null, 2))}>
          Reset from form
        </button>
      </div>
    </section>
  );
}
