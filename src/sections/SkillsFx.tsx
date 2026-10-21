'use client';

import { useLayoutEffect, useRef } from 'react';
import { sectionOf, useReveal } from '@/hooks/useReveal';
import { gsap, prefersReducedMotion } from '@/lib/motion';

export function SkillsFx() {
  const marker = useRef<HTMLSpanElement>(null);

  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.core-panel, .skill-card', depth: true, start: 'top 72%', stagger: 0.08 });

  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.core-row__meter i', {
        scaleX: 0,
        duration: 1.6,
        stagger: 0.18,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '.core-panel', start: 'top 70%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('.skill-card').forEach((card) => {
        gsap.from(card.querySelectorAll('.chip'), {
          y: 10,
          opacity: 0,
          duration: 0.7,
          stagger: 0.04,
          delay: 0.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return <span ref={marker} hidden />;
}
