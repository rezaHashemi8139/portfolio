'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/motion';

interface Props {
  /** 0..1 — real loading progress (fonts, portrait, 3D scene). */
  progress: number;
  /** Status line for screen readers and the meta row. */
  label: string;
  /** Fired when the exit animation has finished. */
  onExit: () => void;
  /** Name spelled out letter by letter. */
  name: string;
}

export function Preloader({ progress, label, onExit, name }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const shown = useRef({ p: 0 });
  const exiting = useRef(false);
  const exitRef = useRef(onExit);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  // Entrance of the name
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.preloader__mark span', { yPercent: 110, duration: 1, stagger: 0.03, ease: 'expo.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  // Ease the counter toward real progress; exit once everything is in.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const tween = gsap.to(shown.current, {
      p: progress,
      duration: reduced ? 0.2 : 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        const v = shown.current.p;
        if (bar.current) bar.current.style.transform = `scaleX(${v})`;
        if (pct.current) pct.current.textContent = `${String(Math.round(v * 100)).padStart(3, '0')}%`;
      },
      onComplete: () => {
        if (progress < 1 || exiting.current || !root.current) return;
        exiting.current = true;
        if (reduced) {
          gsap.to(root.current, { opacity: 0, duration: 0.3, onComplete: () => exitRef.current() });
          return;
        }
        const tl = gsap.timeline({ onComplete: () => exitRef.current() });
        tl.to('.preloader__mark span', { yPercent: -110, duration: 0.7, stagger: 0.02, ease: 'power3.in' }, 0)
          .to(['.preloader__bar', '.preloader__meta'], { opacity: 0, duration: 0.4 }, 0.1)
          .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'expo.inOut' }, 0.45);
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  return (
    <div ref={root} className="preloader" role="status" aria-live="polite" style={{ clipPath: 'inset(0 0 0% 0)' }}>
      <div className="preloader__inner">
        <div className="preloader__mark" aria-hidden="true">
          {name.split('').map((c, i) => (
            <span key={i}>{c === ' ' ? ' ' : c}</span>
          ))}
        </div>
        <div className="preloader__bar">
          <i ref={bar} />
        </div>
        <div className="preloader__meta">
          <span>{label}</span>
          <span ref={pct}>000%</span>
        </div>
        <span className="sr-only">Loading portfolio: {label}</span>
      </div>
    </div>
  );
}
