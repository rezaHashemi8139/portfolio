'use client';

import { useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';

export function EducationFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.section-head [data-reveal]' });
  useReveal(marker, { selector: '.edu-card', depth: true, start: 'top 75%', stagger: 0.12 });
  return <span ref={marker} hidden />;
}
