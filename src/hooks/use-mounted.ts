import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True only after the client has hydrated. Needed for anything that reads
 * next-themes' theme value, since the server can't know the client's
 * preference and rendering it during SSR/hydration would mismatch.
 * Uses useSyncExternalStore (not useEffect+useState) so it doesn't trigger
 * an extra render pass or the react-hooks/set-state-in-effect lint rule.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
