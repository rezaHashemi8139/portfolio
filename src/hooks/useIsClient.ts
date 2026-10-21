import { useSyncExternalStore } from 'react';

const noop = () => () => undefined;

/** false while rendering on the server and during hydration, true afterwards — a hydration-safe `mounted` flag. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
