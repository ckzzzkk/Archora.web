/**
 * ARCoreModule TypeScript Wrapper — Cross-Platform (Android ARCore + iOS ARKit)
 *
 * Android: native module = ARCoreModule (ARCoreModule.kt)
 * iOS:    native module = ARKitModule  (ARKitModule.swift via local CocoaPod)
 *
 * Both expose the same JS interface. The wrapper routes to the correct native
 * module based on Platform.OS and normalises event names.
 */

import { NativeModules, Platform, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

// ── Shared Types ───────────────────────────────────────────────────────────────

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface DetectedPlane {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'unknown';
  centerX: number;
  centerY: number;
  centerZ: number;
  extentX: number;
  extentZ: number;
  confidence: number;
}

export interface ARSupport {
  hasARCore: boolean;    // ARCore on Android / ARKit on iOS
  hasDepthAPI: boolean; // Depth API / LiDAR
  hasLiDAR?: boolean;  // iOS only
  availability?: string;
  error?: string;
  deviceModel?: string;
}

export interface SessionStatus {
  success: boolean;
  depthEnabled: boolean;
  error?: string;
  lidarEnabled?: boolean; // iOS only
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
}

export interface PlaneDetectedEvent {
  count: number;
}

// ── Platform-Aware Native Module Resolution ───────────────────────────────────

type NativeARModule = {
  checkSupport(): Promise<ARSupport>;
  requestCameraPermission?(): Promise<{ granted: boolean }>;
  requestInstall?(): Promise<{ installRequested?: boolean; alreadyInstalled?: boolean }>;
  startSession(): Promise<SessionStatus>;
  stopSession(): Promise<boolean>;
  updateFrame(): Promise<boolean>;
  hitTest(x: number, y: number): Promise<Vector3D | null>;
  getDetectedPlanes(): Promise<DetectedPlane[]>;
  distanceBetween(p1: Vector3D, p2: Vector3D): Promise<number>;
  getCameraPose(): Promise<CameraPose>;
  getMeshVertices?(): Promise<Vector3D[]>;
};

const isAndroid = Platform.OS === 'android';

// Resolve the correct native module
// Android → ARCoreModule  |  iOS → ARKitModule
const nativeModuleName = isAndroid ? 'ARCoreModule' : 'ARKitModule';
const rawNative = (NativeModules as Record<string, unknown>)[nativeModuleName];
const native = rawNative as NativeARModule | undefined;

// Event names differ between platforms
const PLANES_EVENT = isAndroid ? 'ARCorePlanesDetected' : 'ARKitPlanesDetected';
const SESSION_INTERRUPTED_EVENT = isAndroid ? undefined : 'ARKitSessionInterrupted';
const SESSION_RESUMED_EVENT = isAndroid ? undefined : 'ARKitSessionResumed';

// ── Event Emitter Setup ───────────────────────────────────────────────────────

let eventEmitter: NativeEventEmitter | null = null;

if (native) {
  eventEmitter = new NativeEventEmitter(
    (NativeModules as Record<string, unknown>)[nativeModuleName] as any,
  );
}

// ── Fallback Defaults ─────────────────────────────────────────────────────────

const FALLBACK_SUPPORT: ARSupport = {
  hasARCore: false,
  hasDepthAPI: false,
};

// ── Module Interface ──────────────────────────────────────────────────────────

export const ARCoreModule = {
  /** True if a native AR module is available */
  isAvailable: !!native,

  // ── checkSupport ──────────────────────────────────────────────────────────

  checkSupport: async (): Promise<ARSupport> => {
    if (!native) return FALLBACK_SUPPORT;
    try {
      return await native.checkSupport();
    } catch {
      return FALLBACK_SUPPORT;
    }
  },

  // ── requestInstall (Android only) ─────────────────────────────────────────

  /** Android: request ARCore install. iOS: request camera permission. */
  requestInstall: async (): Promise<{ installRequested?: boolean; alreadyInstalled?: boolean } | { granted?: boolean }> => {
    if (!native) {
      if (isAndroid) return { installRequested: false, alreadyInstalled: false };
      // iOS: request camera permission via rawNative (not narrowed)
      const raw = rawNative as unknown as NativeARModule;
      const { requestCameraPermission } = raw;
      if (requestCameraPermission) return await requestCameraPermission();
      return { granted: false };
    }
    if (isAndroid) {
      return await (native as any).requestInstall();
    } else {
      // iOS: request camera permission
      const fn = (native as any).requestCameraPermission;
      if (fn) return await fn();
      return { granted: true };
    }
  },

  // ── startSession ──────────────────────────────────────────────────────────

  startSession: async (): Promise<SessionStatus> => {
    if (!native) {
      return { success: false, depthEnabled: false, error: 'AR module not available' };
    }
    try {
      return await native.startSession();
    } catch (e: any) {
      console.warn(`[ARKit] startSession failed:`, e);
      return { success: false, depthEnabled: false, error: e?.message };
    }
  },

  // ── stopSession ──────────────────────────────────────────────────────────

  stopSession: async (): Promise<boolean> => {
    if (!native) return false;
    try {
      return await native.stopSession();
    } catch (e: any) {
      console.warn('[ARKit] stopSession failed', e);
      return false;
    }
  },

  // ── updateFrame ───────────────────────────────────────────────────────────

  updateFrame: async (): Promise<boolean> => {
    if (!native) return false;
    try {
      return await native.updateFrame();
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
      return await native.hitTest(x, y);
    } catch {
      return null;
    }
  },

  // ── getDetectedPlanes ────────────────────────────────────────────────────

  getDetectedPlanes: async (): Promise<DetectedPlane[]> => {
    if (!native) return [];
    try {
      return await native.getDetectedPlanes();
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
        return await native.distanceBetween(p1, p2);
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
      return await native.getCameraPose();
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
  addPlanesDetectedListener: (callback: (event: PlaneDetectedEvent) => void) => {
    if (eventEmitter) {
      return eventEmitter.addListener(PLANES_EVENT, callback);
    }
    return { remove: () => {} } as ReturnType<NativeEventEmitter['addListener']>;
  },

  addSessionInterruptedListener: (callback: (event: { reason?: string }) => void) => {
    if (eventEmitter && SESSION_INTERRUPTED_EVENT) {
      return eventEmitter.addListener(SESSION_INTERRUPTED_EVENT, callback);
    }
    return { remove: () => {} } as ReturnType<NativeEventEmitter['addListener']>;
  },

  addSessionResumedListener: (callback: () => void) => {
    if (eventEmitter && SESSION_RESUMED_EVENT) {
      return eventEmitter.addListener(SESSION_RESUMED_EVENT, callback);
    }
    return { remove: () => {} } as ReturnType<NativeEventEmitter['addListener']>;
  },

  removeAllListeners: () => {
    if (eventEmitter) {
      eventEmitter.removeAllListeners(PLANES_EVENT);
      if (SESSION_INTERRUPTED_EVENT) eventEmitter.removeAllListeners(SESSION_INTERRUPTED_EVENT);
      if (SESSION_RESUMED_EVENT) eventEmitter.removeAllListeners(SESSION_RESUMED_EVENT);
    }
  },
};

// ── Capability Query ─────────────────────────────────────────────────────────

export async function getARCapabilities(): Promise<ARSupport & { canRunAR: boolean }> {
  const support = await ARCoreModule.checkSupport();
  return {
    ...support,
    canRunAR: support.hasARCore,
  };
}

// ── Coordinate Helpers ────────────────────────────────────────────────────────

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
