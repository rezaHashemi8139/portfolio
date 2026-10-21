'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/motion';

interface RevealOptions {
  /** CSS selector (inside the scope) for elements to reveal in order. */
  selector?: string;
  y?: number;
  stagger?: number;
  start?: string;
  /** Adds a slight 3D tilt + blur to glass panels as they arrive. */
  depth?: boolean;
  /** Give every element its own trigger (for long, tall lists). */
  each?: boolean;
}

/** The section/footer that contains an animation marker element. */
export const sectionOf = (marker: RefObject<Element | null>) => marker.current?.closest<HTMLElement>('section, footer') ?? null;

/**
 * Scroll-triggered entrance for everything matching `[data-reveal]` inside the marker's section.
 * Elements are fully visible in the server-rendered HTML; GSAP only hides them once JS runs,
 * and only for content that hasn't been scrolled to yet.
 */
export function useReveal(marker: RefObject<Element | null>, opts: RevealOptions = {}) {
  const { selector = '[data-reveal]', y = 48, stagger = 0.09, start = 'top 82%', depth = false, each = false } = opts;

  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector, root);
      if (!items.length) return;
      const vars: gsap.TweenVars = {
        y,
        opacity: 0,
        rotateX: depth ? 8 : 0,
        filter: depth ? 'blur(8px)' : 'none',
        transformPerspective: 900,
        transformOrigin: '50% 100%',
        duration: 1.2,
        ease: 'expo.out',
        clearProps: 'filter,transform',
      };
      if (each) {
        items.forEach((el) => gsap.from(el, { ...vars, scrollTrigger: { trigger: el, start, once: true } }));
      } else {
        gsap.from(items, { ...vars, stagger, scrollTrigger: { trigger: root, start, once: true } });
      }
    }, root);

    return () => ctx.revert();
  }, [marker, selector, y, stagger, start, depth, each]);
}
