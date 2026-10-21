'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  value: string;
  label: string;
  /** id of the element holding the visible text — selected as a fallback when clipboard access is refused. */
  targetId: string;
}

export function CopyButton({ value, label, targetId }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const reset = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const selectText = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    setState('selected');
    reset();
  };

  const onClick = () => {
    if (!navigator.clipboard?.writeText) {
      selectText();
      return;
    }
    navigator.clipboard.writeText(value).then(
      () => {
        setState('copied');
        reset();
      },
      () => selectText(),
    );
  };

  const status = state === 'copied' ? `${label} copied` : state === 'selected' ? `${label} selected — press Ctrl+C or ⌘C to copy` : '';

  return (
    <>
      <button type="button" className="icon-btn" onClick={onClick} aria-label={`Copy ${label}`} title={`Copy ${label}`} data-cursor="hover">
        {state === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
