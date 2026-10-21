'use client';

import { useLayoutEffect, useRef } from 'react';
import { sectionOf, useReveal } from '@/hooks/useReveal';
import { gsap, prefersReducedMotion } from '@/lib/motion';

/** Motion for the About section. Renders nothing visible; the markup is server-rendered. */
export function AboutFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.about__panel, .stats', depth: true, start: 'top 70%', stagger: 0.15 });

  // Statement words brighten in sequence as you read; stats count up.
  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about__statement .w',
        { opacity: 0.18 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: { trigger: '.about__statement', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      );
      gsap.utils.toArray<HTMLElement>('.stat__num').forEach((el) => {
        const target = Number(el.dataset.value);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString('en-US');
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return <span ref={marker} hidden />;
}
