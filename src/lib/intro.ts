'use client';

import { useSyncExternalStore } from 'react';

/**
 * "The preloader has cleared" flag. Server-rendered sections can't take a `play` prop from the
 * client-side loader, so their animation components subscribe to this tiny store instead.
 */
let played = false;
const listeners = new Set<() => void>();

export function markIntroPlayed() {
  if (played) return;
  played = true;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useIntroPlayed(): boolean {
  return useSyncExternalStore(subscribe, () => played, () => false);
}
