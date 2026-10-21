'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, isFinePointer, prefersReducedMotion } from '@/lib/motion';
import { useIsClient } from '@/hooks/useIsClient';

const HOVERABLE = 'a, button, [data-cursor="hover"], [role="button"], summary';

/**
 * A two-part cursor (dot + trailing ring) for mouse users, plus magnetic pull on
 * elements marked `data-magnetic`. Disabled on touch devices and for reduced motion.
 */
export function Cursor() {
  const client = useIsClient();
  const enabled = client && isFinePointer() && !prefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!enabled || !root.current || !dot.current || !ring.current) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');
    const el = root.current;

    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3.out' });

    let magnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      el.classList.remove('is-hidden');
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      const target = e.target as Element | null;
      const labelled = target?.closest<HTMLElement>('[data-cursor-label]');
      const hover = target?.closest(HOVERABLE);
      el.classList.toggle('is-label', !!labelled);
      el.classList.toggle('is-hover', !labelled && !!hover);
      setLabel(labelled?.dataset.cursorLabel ?? '');

      const m = target?.closest<HTMLElement>('[data-magnetic]') ?? null;
      if (magnet && magnet !== m) {
        gsap.to(magnet, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      }
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(m, { x: dx * 0.22, y: dy * 0.32, duration: 0.5, ease: 'power3.out' });
      }
    };
    const onLeave = () => el.classList.add('is-hidden');
    const onDown = () => gsap.to(ring.current, { scale: 0.82, duration: 0.18 });
    const onUp = () => gsap.to(ring.current, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    html.addEventListener('pointerleave', onLeave);
    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      html.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={root} className="cursor is-hidden" aria-hidden="true">
      <div ref={dot} className="cursor__dot" />
      <div ref={ring} className="cursor__ring">
        <span className="cursor__label">{label}</span>
      </div>
    </div>
  );
}
