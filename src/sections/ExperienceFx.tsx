'use client';

import { useLayoutEffect, useRef } from 'react';
import { sectionOf, useReveal } from '@/hooks/useReveal';
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion';

export function ExperienceFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.tl-item', each: true, depth: true, start: 'top 85%' });

  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root) return;
    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      if (reduced) {
        gsap.set('.timeline__fill', { scaleY: 1 });
      } else {
        gsap.to('.timeline__fill', {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: 0.4 },
        });
      }
      gsap.utils.toArray<HTMLElement>('.tl-item').forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 60%',
          end: 'bottom 60%',
          toggleClass: { targets: item, className: 'is-active' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return <span ref={marker} hidden />;
}
