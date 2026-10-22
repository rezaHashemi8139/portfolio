'use client';

import { Fragment, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import type { SiteContent } from '@/lib/schema';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';

type Job = SiteContent['experience'][number];

const VISIBLE = 3;
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Props {
  job: Job;
  index: number;
  /** Phrases to highlight inside the bullet points (longest first so "React Testing Library" beats "React"). */
  terms: string[];
  startLabel: string;
  endLabel: string;
  durationLabel: string;
}

export function JobCard({ job, index, terms, startLabel, endLabel, durationLabel }: Props) {
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const first = job.highlights.slice(0, VISIBLE);
  const rest = job.highlights.slice(VISIBLE);
  const moreId = `job-more-${index}`;

  const sorted = [...terms].filter(Boolean).sort((x, y) => y.length - x.length);
  const termRe = sorted.length ? new RegExp(`(${sorted.map(escape).join('|')})`, 'g') : null;
  const highlight = (text: string): ReactNode =>
    termRe ? text.split(termRe).map((part, i) => (sorted.includes(part) ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>)) : text;

  const toggle = () => {
    const el = moreRef.current;
    const next = !open;
    setOpen(next);
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.height = next ? 'auto' : '0px';
      el.style.opacity = next ? '1' : '0';
      return;
    }
    if (next) {
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.7, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
    }
  };

  return (
    <li className="tl-item" data-reveal>
      <span className="tl-item__node" aria-hidden="true" />
      <div className="tl-item__meta">
        <span className="range">
          <time dateTime={job.start}>{startLabel}</time> — {job.end ? <time dateTime={job.end}>{endLabel}</time> : 'Present'}
        </span>
        {!job.end ? <span className="now">Current role</span> : null}
        <span>{durationLabel}</span>
      </div>

      <article className="tl-card glass" aria-labelledby={`job-${index}`}>
        <div className="tl-card__head">
          <div className="tl-card__brand">
            {job.logo ? (
              // Plain <img>: logos are uploaded at runtime from the admin (same reason as the hero portrait).
              // eslint-disable-next-line @next/next/no-img-element
              <img className="tl-card__logo" src={job.logo} alt="" width={52} height={52} loading="lazy" decoding="async" />
            ) : null}
            <div>
              <h3 id={`job-${index}`}>
                {job.companyUrl ? (
                  <a className="tl-card__company" href={job.companyUrl} target="_blank" rel="noopener noreferrer" data-cursor="hover">
                    {job.company}
                    <ArrowUpRight aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="tl-card__company">{job.company}</span>
                )}
              </h3>
              <p className="tl-card__role">{job.role}</p>
            </div>
          </div>
          {job.location ? (
            <span className="tl-card__loc">
              <MapPin aria-hidden="true" />
              {job.location}
            </span>
          ) : null}
        </div>

        <ul className="tl-card__list">
          {first.map((h) => (
            <li key={h}>{highlight(h)}</li>
          ))}
        </ul>

        {rest.length > 0 ? (
          <div id={moreId} ref={moreRef} className="tl-card__more" style={{ height: 0, opacity: 0 }}>
            <ul className="tl-card__list" aria-hidden={!open}>
              {rest.map((h) => (
                <li key={h}>{highlight(h)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="tl-card__foot">
          <ul className="chips" aria-label="Technologies">
            {job.stack.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
          {rest.length > 0 ? (
            <button type="button" className="text-btn" aria-expanded={open} aria-controls={moreId} onClick={toggle}>
              {open ? 'Show less' : `Show ${rest.length} more`}
              <ChevronDown aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </article>
    </li>
  );
}
