/**
 * Screen Garbage Collector Engine
 * 
 * Tracks mounted screens and automatically releases heavy state
 * (video arrays, thumbnails, preview URLs) from inactive screens
 * after a configurable delay. Also monitors for memory pressure
 * (too many inactive screens holding data) and aggressively cleans.
 * 
 * Usage: Screens register via the useScreenGC() hook.
 */
import { AppState, AppStateStatus } from 'react-native';

type CleanupFn = () => void;
type ReactivateFn = () => void;

interface ScreenRegistration {
  screenId: string;
  cleanup: CleanupFn;
  reactivate?: ReactivateFn;
  isFocused: boolean;
  lastBlurTime: number;
  cleanupTimer: NodeJS.Timeout | null;
  hasBeenCleaned: boolean;
  delayMs: number;
}

class GarbageCollector {
  private screens = new Map<string, ScreenRegistration>();
  private memoryPollTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private isInitialized = false;

  // ── Configuration ──
  private readonly MEMORY_POLL_INTERVAL = 15_000;  // Check every 15s
  private readonly MAX_CACHED_INACTIVE = 2;         // Keep at most 2 inactive screens cached

  /** Initialize background monitoring (called once automatically) */
  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Periodic memory pressure check
    this.memoryPollTimer = setInterval(() => {
      this.checkMemoryPressure();
    }, this.MEMORY_POLL_INTERVAL);

    // Clean all inactive screens when app is backgrounded
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        console.log('[GC] 📱 App backgrounded — cleaning all inactive screens');
        this.forceCleanupAllInactive();
      }
    });
  }

  /** Register a screen with the GC engine. Returns an unregister function. */
  register(
    screenId: string,
    cleanup: CleanupFn,
    reactivate?: ReactivateFn,
    delayMs: number = 30_000,
  ): () => void {
    this.init();

    // Clear any existing registration for this screen
    const existing = this.screens.get(screenId);
    if (existing?.cleanupTimer) clearTimeout(existing.cleanupTimer);

    this.screens.set(screenId, {
      screenId,
      cleanup,
      reactivate,
      isFocused: true,
      lastBlurTime: 0,
      cleanupTimer: null,
      hasBeenCleaned: false,
      delayMs,
    });

    return () => {
      const reg = this.screens.get(screenId);
      if (reg?.cleanupTimer) clearTimeout(reg.cleanupTimer);
      this.screens.delete(screenId);
    };
  }

  /** Called when a screen gains focus */
  onScreenFocus(screenId: string) {
    const reg = this.screens.get(screenId);
    if (!reg) return;

    // Cancel any pending cleanup timer
    if (reg.cleanupTimer) {
      clearTimeout(reg.cleanupTimer);
      reg.cleanupTimer = null;
    }

    reg.isFocused = true;

    // If data was cleaned, trigger reactivation (re-fetch)
    if (reg.hasBeenCleaned && reg.reactivate) {
      console.log(`[GC] ♻️ Reactivating: ${screenId}`);
      reg.reactivate();
      reg.hasBeenCleaned = false;
    }
  }

  /** Called when a screen loses focus — schedules cleanup */
  onScreenBlur(screenId: string) {
    const reg = this.screens.get(screenId);
    if (!reg) return;

    reg.isFocused = false;
    reg.lastBlurTime = Date.now();

    // Cancel any existing timer
    if (reg.cleanupTimer) clearTimeout(reg.cleanupTimer);

    // Schedule cleanup after delay
    reg.cleanupTimer = setTimeout(() => {
      this.cleanupScreen(screenId);
    }, reg.delayMs);
  }

  /** Execute cleanup for a specific screen */
  private cleanupScreen(screenId: string) {
    const reg = this.screens.get(screenId);
    if (!reg || reg.isFocused || reg.hasBeenCleaned) return;

    const inactiveSec = ((Date.now() - reg.lastBlurTime) / 1000).toFixed(0);
    console.log(`[GC] 🧹 Cleaning: ${screenId} (inactive ${inactiveSec}s)`);

    try {
      reg.cleanup();
      reg.hasBeenCleaned = true;
      reg.cleanupTimer = null;
    } catch (e) {
      console.warn(`[GC] Cleanup failed for ${screenId}:`, e);
    }
  }

  /** Force-clean all screens that are not currently focused */
  forceCleanupAllInactive() {
    for (const [id, reg] of this.screens) {
      if (!reg.isFocused && !reg.hasBeenCleaned) {
        this.cleanupScreen(id);
      }
    }
  }

  /** Check if too many inactive screens are holding data */
  private checkMemoryPressure() {
    const inactiveWithData = [...this.screens.values()]
      .filter(r => !r.isFocused && !r.hasBeenCleaned);

    if (inactiveWithData.length > this.MAX_CACHED_INACTIVE) {
      console.log(`[GC] ⚠️ Pressure: ${inactiveWithData.length} inactive screens holding data`);

      // Sort oldest-inactive-first and clean all but MAX_CACHED_INACTIVE
      const sorted = inactiveWithData.sort((a, b) => a.lastBlurTime - b.lastBlurTime);
      const toClean = sorted.length - this.MAX_CACHED_INACTIVE;

      for (let i = 0; i < toClean; i++) {
        this.cleanupScreen(sorted[i].screenId);
      }
    }
  }

  /** Destroy the GC engine (call on app teardown) */
  destroy() {
    if (this.memoryPollTimer) clearInterval(this.memoryPollTimer);
    if (this.appStateSubscription) this.appStateSubscription.remove();
    for (const [, reg] of this.screens) {
      if (reg.cleanupTimer) clearTimeout(reg.cleanupTimer);
    }
    this.screens.clear();
    this.isInitialized = false;
  }
}

/** Singleton GC instance shared across all screens */
export const gc = new GarbageCollector();
