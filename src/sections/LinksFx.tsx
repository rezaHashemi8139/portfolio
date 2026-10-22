'use client';

import { useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';

export function LinksFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.link-card', depth: true, start: 'top 80%', stagger: 0.08 });
  return <span ref={marker} hidden />;
}
