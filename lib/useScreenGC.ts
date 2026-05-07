/**
 * useScreenGC — React hook for automatic screen garbage collection
 * 
 * Integrates with the GC engine to:
 *  1. Detect when a screen loses focus (tab switch / navigation)
 *  2. After `delayMs`, call `onCleanup` to release heavy state
 *  3. On re-focus, call `onReactivate` to re-fetch data
 * 
 * Usage:
 *   useScreenGC('HomeScreen', {
 *     delayMs: 30_000,
 *     onCleanup: () => { setData({}); setImages(null); },
 *     onReactivate: () => { fetchData(); },
 *   });
 */
import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { gc } from './gc';

interface UseScreenGCOptions {
  /** Delay in ms before cleaning after screen loses focus (default: 30000) */
  delayMs?: number;
  /** Called to release heavy state (video arrays, thumbnails, etc.) */
  onCleanup: () => void;
  /** Called when screen is re-focused after cleanup to re-fetch data */
  onReactivate: () => void;
}

export function useScreenGC(screenId: string, options: UseScreenGCOptions): void {
  const isFocused = useIsFocused();

  // Keep refs to latest callbacks to avoid stale closures
  const cleanupRef = useRef(options.onCleanup);
  const reactivateRef = useRef(options.onReactivate);
  cleanupRef.current = options.onCleanup;
  reactivateRef.current = options.onReactivate;

  const delayMs = options.delayMs ?? 30_000;

  // Register with GC engine once
  useEffect(() => {
    const unregister = gc.register(
      screenId,
      () => cleanupRef.current(),
      () => reactivateRef.current(),
      delayMs,
    );
    return unregister;
  }, [screenId, delayMs]);

  // Track focus changes
  useEffect(() => {
    if (isFocused) {
      gc.onScreenFocus(screenId);
    } else {
      gc.onScreenBlur(screenId);
    }
  }, [isFocused, screenId]);
}
