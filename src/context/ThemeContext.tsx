'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { applyDomTheme, currentDomTheme, readStoredTheme, storeTheme, type Theme } from '@/lib/theme';
import { sceneBus } from '@/three/sceneBus';
import { prefersReducedMotion } from '@/lib/motion';

interface ThemeContextValue {
  theme: Theme;
  /** Toggle the theme; pass the click origin for the circular reveal. */
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { ready: Promise<void>; finished: Promise<void> };
};

/*
 * The theme lives on <html data-theme>, set by an inline script before first paint (see the site layout).
 * React mirrors it through an external store: the server snapshot is always "dark", and after hydration
 * React re-reads the real attribute — so there is never a hydration mismatch.
 */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const emit = () => listeners.forEach((l) => l());

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, currentDomTheme, () => 'dark');

  // Follow OS changes until the visitor makes an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (readStoredTheme()) return;
      const next: Theme = mq.matches ? 'light' : 'dark';
      applyDomTheme(next);
      sceneBus.scene?.setTheme(next);
      emit();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = currentDomTheme() === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      const doc = document as ViewTransitionDoc;
      const reduced = prefersReducedMotion();

      if (doc.startViewTransition && !reduced) {
        const x = origin?.x ?? window.innerWidth - 40;
        const y = origin?.y ?? 40;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const vt = doc.startViewTransition(() => {
          applyDomTheme(next);
          sceneBus.scene?.setTheme(next, true);
          sceneBus.scene?.renderNow();
          emit();
        });
        vt.ready
          .then(() => {
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
              { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
            );
          })
          .catch(() => undefined);
        return;
      }

      const root = document.documentElement;
      if (!reduced) root.classList.add('theme-anim');
      applyDomTheme(next);
      sceneBus.scene?.setTheme(next, reduced);
      emit();
      window.setTimeout(() => root.classList.remove('theme-anim'), 700);
    },
    [],
  );

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
