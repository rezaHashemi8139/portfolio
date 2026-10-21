'use client';

import { useRef, type PointerEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { isFinePointer, prefersReducedMotion } from '@/lib/motion';

type Project = SiteContent['projects'][number];

const MAX_TILT = 7;

export function ProjectCard({ p, current }: { p: Project; current: boolean }) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (!isFinePointer() || prefersReducedMotion()) return;
    el.classList.add('is-tilting');
    el.style.setProperty('--ry', `${(x / r.width - 0.5) * MAX_TILT * 2}deg`);
    el.style.setProperty('--rx', `${-(y / r.height - 0.5) * MAX_TILT * 2}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <article ref={ref} className="project glass sheen" onPointerMove={onMove} onPointerLeave={onLeave} aria-labelledby={`project-${p.id}`} data-reveal>
      <div className="project__top">
        <div className="project__context">
          <b>{p.context}</b>
          <span>{p.year}</span>
        </div>
        {p.metricValue ? (
          <div className="project__metric">
            <b>{p.metricValue}</b>
            <small>{p.metricLabel}</small>
          </div>
        ) : current ? (
          <span className="project__badge">Current role</span>
        ) : null}
      </div>

      <h3 id={`project-${p.id}`}>{p.title}</h3>
      <p className="project__summary">{p.summary}</p>

      {p.contributions.length > 0 ? (
        <ul className="project__list" aria-label="Contributions and results">
          {p.contributions.map((c) => (
            <li key={c}>
              <Check aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="project__foot">
        <ul className="chips" aria-label="Technologies">
          {p.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
        {p.linkHref ? (
          <a className="project__link" href={p.linkHref} target="_blank" rel="noopener noreferrer" data-cursor-label="Visit">
            {p.linkLabel || p.linkHref}
            <ArrowUpRight aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
