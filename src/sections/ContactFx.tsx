'use client';

import { useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';

export function ContactFx() {
  const marker = useRef<HTMLSpanElement>(null);
  useReveal(marker, { selector: '.contact__head > *', stagger: 0.1 });
  useReveal(marker, { selector: '.contact-card', depth: true, start: 'top 80%', stagger: 0.08 });
  return <span ref={marker} hidden />;
}
