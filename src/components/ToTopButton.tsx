'use client';

import { ArrowUp } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/motion';

export function ToTopButton() {
  const toTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.brand')?.focus({ preventScroll: true });
  };

  return (
    <button type="button" className="to-top" onClick={toTop} data-cursor="hover">
      Back to top
      <span aria-hidden="true">
        <ArrowUp />
      </span>
    </button>
  );
}
