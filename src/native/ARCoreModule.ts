/**
 * ARCoreModule TypeScript Wrapper — Cross-Platform (Android ARCore + iOS ARKit)
 *
 * Android: native module = ARCoreModule (ARCoreModule.kt)
 * iOS:    native module = ARKitModule  (ARKitModule.swift via local CocoaPod)
 *
 * Both expose the same JS interface. The wrapper routes to the correct native
 * module based on Platform.OS and normalises event names.
 *
 * Now using TurboModuleRegistry for type-safe access instead of NativeModules.
 */

import { Platform, NativeEventEmitter } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Spec } from './ARModuleNativeSpec';
import type {
  Vector3D,
  DetectedPlane,
  ARSupport,
  SessionStatus,
  CameraPose,
  PlaneDetectedEvent,
} from './ARModuleNativeSpec';

// ── Platform-Aware Module Resolution ─────────────────────────────────────────

const isAndroid = Platform.OS === 'android';
const nativeModuleName = isAndroid ? 'ARCoreModule' : 'ARKitModule';

// Get the TurboModule (throws if not found — use try/catch for graceful fallback)
function getNativeModule(): Spec | null {
  try {
    return TurboModuleRegistry.getEnforcing<Spec>(nativeModuleName);
  } catch {
    return null;
  }
}

const native = getNativeModule();

// ── Event Emitter Setup ───────────────────────────────────────────────────────

// Event names differ between platforms
const PLANES_EVENT = isAndroid ? 'ARCorePlanesDetected' : 'ARKitPlanesDetected';
const SESSION_INTERRUPTED_EVENT = isAndroid ? null : 'ARKitSessionInterrupted';
const SESSION_RESUMED_EVENT = isAndroid ? null : 'ARKitSessionResumed';

let eventEmitter: NativeEventEmitter | null = null;

if (native) {
  try {
    eventEmitter = new NativeEventEmitter(native as any);
  } catch {
    // Fallback if event emitter creation fails
  }
}

// ── Fallback Defaults ─────────────────────────────────────────────────────────

const FALLBACK_SUPPORT: ARSupport = {
  hasARCore: false,
  hasDepthAPI: false,
};

// ── Module Interface ───────────────────────────────────────────────────────────

export const ARCoreModule = {
  /** True if a native AR TurboModule is available */
  isAvailable: !!native,

  // ── checkSupport ──────────────────────────────────────────────────────────

  checkSupport: async (): Promise<ARSupport> => {
    if (!native) return FALLBACK_SUPPORT;
    try {
      return await (native as Spec).checkSupport();
    } catch {
      return FALLBACK_SUPPORT;
    }
  },

  // ── requestInstall (Android) / requestCameraPermission (iOS) ─────────────

  requestInstall: async (): Promise<
    | { installRequested?: boolean; alreadyInstalled?: boolean }
    | { granted?: boolean }
  > => {
    if (!native) {
      if (isAndroid) return { installRequested: false, alreadyInstalled: false };
      return { granted: false };
    }
    if (isAndroid) {
      const fn = (native as Spec).requestInstall;
      return fn ? await fn() : { installRequested: false, alreadyInstalled: false };
    } else {
      const fn = (native as Spec).requestCameraPermission;
      return fn ? await fn() : { granted: true };
    }
  },

  // ── startSession ──────────────────────────────────────────────────────────

  startSession: async (): Promise<SessionStatus> => {
    if (!native) {
      return { success: false, depthEnabled: false, error: 'AR module not available' };
    }
    try {
      return await (native as Spec).startSession();
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      console.warn(`[AR] startSession failed:`, error);
      return { success: false, depthEnabled: false, error };
    }
  },

  // ── stopSession ──────────────────────────────────────────────────────────

  stopSession: async (): Promise<boolean> => {
    if (!native) return false;
    try {
      return await (native as Spec).stopSession();
    } catch (e: unknown) {
      console.warn('[AR] stopSession failed', e);
      return false;
    }
  },

  // ── updateFrame ───────────────────────────────────────────────────────────

  updateFrame: async (): Promise<boolean> => {
    if (!native) return false;
    try {
      return await (native as Spec).updateFrame();
    } catch {
      return false;
    }
  },

  // ── hitTest ──────────────────────────────────────────────────────────────

  /**
   * Perform a hit test at screen coordinates (pixels).
   * Android: ARCore hit test against detected planes
   * iOS:     ARKit raycast + feature point hit test
   * Returns world-space 3D position or null.
   */
  hitTest: async (x: number, y: number): Promise<Vector3D | null> => {
    if (!native) return null;
    try {
      return await (native as Spec).hitTest(x, y);
    } catch {
      return null;
    }
  },

  // ── getDetectedPlanes ────────────────────────────────────────────────────

  getDetectedPlanes: async (): Promise<DetectedPlane[]> => {
    if (!native) return [];
    try {
      return await (native as Spec).getDetectedPlanes();
    } catch {
      return [];
    }
  },

  // ── distanceBetween ──────────────────────────────────────────────────────

  /**
   * Calculate real-world distance (metres) between two 3D world-space points.
   * Falls back to pure JS math if native call fails.
   */
  distanceBetween: async (p1: Vector3D, p2: Vector3D): Promise<number> => {
    if (native) {
      try {
        return await (native as Spec).distanceBetween(p1, p2);
      } catch { /* fall through to JS */ }
    }
    // Pure JS fallback
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2),
    );
  },

  // ── getCameraPose ────────────────────────────────────────────────────────

  getCameraPose: async (): Promise<CameraPose | null> => {
    if (!native) return null;
    try {
      return await (native as Spec).getCameraPose();
    } catch {
      return null;
    }
  },

  // ── Event Listeners ──────────────────────────────────────────────────────

  /**
   * Listen for plane detection events from the native session.
   * Android: 'ARCorePlanesDetected'
   * iOS:     'ARKitPlanesDetected'
   */
  addPlanesDetectedListener: (
    callback: (event: PlaneDetectedEvent) => void,
  ): { remove: () => void } => {
    if (eventEmitter) {
      return eventEmitter.addListener(PLANES_EVENT, callback);
    }
    return { remove: () => {} };
  },

  addSessionInterruptedListener: (
    callback: (event: { reason?: string }) => void,
  ): { remove: () => void } => {
    if (eventEmitter && SESSION_INTERRUPTED_EVENT) {
      return eventEmitter.addListener(SESSION_INTERRUPTED_EVENT, callback);
    }
    return { remove: () => {} };
  },

  addSessionResumedListener: (callback: () => void): { remove: () => void } => {
    if (eventEmitter && SESSION_RESUMED_EVENT) {
      return eventEmitter.addListener(SESSION_RESUMED_EVENT, callback);
    }
    return { remove: () => {} };
  },

  removeAllListeners: () => {
    if (eventEmitter) {
      eventEmitter.removeAllListeners(PLANES_EVENT);
      if (SESSION_INTERRUPTED_EVENT) eventEmitter.removeAllListeners(SESSION_INTERRUPTED_EVENT);
      if (SESSION_RESUMED_EVENT) eventEmitter.removeAllListeners(SESSION_RESUMED_EVENT);
    }
  },
};

// ── Capability Query ────────────────────────────────────────────────────────────

export async function getARCapabilities(): Promise<ARSupport & { canRunAR: boolean }> {
  const support = await ARCoreModule.checkSupport();
  return {
    ...support,
    canRunAR: support.hasARCore,
  };
}

// ── Coordinate Helpers ─────────────────────────────────────────────────────────

/**
 * Convert AR world coordinates to blueprint 2D top-down coordinates.
 *
 * Android (ARCore):  Y-up right-hand  → X=east, Y=up, Z=toward viewer
 * iOS (ARKit):       Y-up right-hand  → X=right, Y=up, Z=into scene
 *
 * Both use Y-up, so the XZ plane is the floor.
 * Blueprint top-down: X=east, Y=north (2D top-down view).
 *
 * ARKit:  Blueprint.x = ARKit.x,  Blueprint.y = -ARKit.z  (same as ARCore)
 * ARCore: Blueprint.x = ARCore.x, Blueprint.y = -ARCore.z
 *
 * 3D furniture world position is identical — just take x and -z.
 */
export function toBlueprint2D(v: Vector3D): { x: number; y: number } {
  return {
    x: v.x,
    y: -v.z,
  };
}

/**
 * Snap a value to the nearest grid intersection (default 5cm).
 */
export function snapToGrid(value: number, gridSize = 0.05): number {
  return Math.round(value / gridSize) * gridSize;
}

// Re-export types for consumers
export type { Vector3D, DetectedPlane, ARSupport, SessionStatus, CameraPose } from './ARModuleNativeSpec';