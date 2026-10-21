'use client';

import { useLayoutEffect, useRef } from 'react';
import { sectionOf } from '@/hooks/useReveal';
import { gsap, prefersReducedMotion } from '@/lib/motion';

// Closing gesture: the wordmark rises letter by letter as you reach the end.
export function FooterFx() {
  const marker = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.wordmark span', {
        yPercent: 100,
        opacity: 0,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.wordmark', start: 'top 100%', end: 'bottom 92%', scrub: 0.8 },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return <span ref={marker} hidden />;
}
