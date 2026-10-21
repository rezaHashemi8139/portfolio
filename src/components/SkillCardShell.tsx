'use client';

import type { PointerEvent, ReactNode } from 'react';

/** Server-rendered card content inside a tiny client wrapper that tracks the pointer for the glow. */
export function SkillCardShell({ className, labelledBy, children }: { className: string; labelledBy: string; children: ReactNode }) {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <article className={className} onPointerMove={onMove} aria-labelledby={labelledBy}>
      {children}
    </article>
  );
}
