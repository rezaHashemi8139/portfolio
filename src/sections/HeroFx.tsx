'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, isFinePointer, prefersReducedMotion } from '@/lib/motion';
import { useIntroPlayed } from '@/lib/intro';
import { sectionOf } from '@/hooks/useReveal';

/** Intro timeline, portrait parallax and scroll drift for the (server-rendered) hero. */
export function HeroFx() {
  const marker = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const play = useIntroPlayed();

  // Build the intro timeline paused; hidden states only exist once JS has run.
  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .from('.hero__name .char', { yPercent: 115, rotate: 6, duration: 1.4, stagger: 0.035 }, 0)
        .from('.hero__eyebrow', { y: 16, opacity: 0, duration: 1 }, 0.2)
        .from('.hero__role', { y: 24, opacity: 0, duration: 1.1 }, 0.55)
        .from('.portrait', { y: 60, opacity: 0, rotateY: -14, rotateX: 6, scale: 0.94, duration: 1.8, transformPerspective: 1200 }, 0.35)
        .from('.portrait__frame img', { scale: 1.35, duration: 2.2, ease: 'power3.out' }, 0.35)
        .from('.portrait__badge', { x: -30, opacity: 0, duration: 1.2 }, 1.0)
        .from('.hero__intro', { y: 24, opacity: 0, duration: 1.1 }, 0.75)
        .from('.hero__ctas > *', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.9)
        .from('.hero__stack > *', { y: 12, opacity: 0, duration: 0.9, stagger: 0.05 }, 1.05)
        .from('.scroll-cue', { opacity: 0, y: -10, duration: 1 }, 1.4);
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (play) tl.current?.play();
  }, [play]);

  // Pointer-driven depth on the portrait
  useEffect(() => {
    const card = sectionOf(marker)?.querySelector<HTMLElement>('.portrait');
    if (!card || !isFinePointer() || prefersReducedMotion()) return;
    const img = card.querySelector('img');
    // Canonical names: quickTo looks tweens up by property name and does not understand the rotateX/rotateY aliases.
    const rx = gsap.quickTo(card, 'rotationX', { duration: 1, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 1, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 1200 });
    const onMove = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry(nx * 8);
      rx(-ny * 6);
      img?.style.setProperty('--px', `${-nx * 14}px`);
      img?.style.setProperty('--py', `${-ny * 14}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Hero drifts back as you scroll away
  useLayoutEffect(() => {
    const root = sectionOf(marker);
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to('.hero__grid', {
        yPercent: -8,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return <span ref={marker} hidden />;
}
