'use client';

import { useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';

export function WorkFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.project', depth: true, start: 'top 75%', stagger: 0.1, y: 70 });
  return <span ref={marker} hidden />;
}
