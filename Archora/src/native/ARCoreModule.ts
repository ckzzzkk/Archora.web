import { NativeModules, Platform, NativeEventEmitter, DeviceEventEmitter } from 'react-native';


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

export interface ARCoreSupport {
  hasARCore: boolean;
  hasDepthAPI: boolean;
  availability?: string;
  error?: string;
}

export interface SessionStatus {
  success: boolean;
  depthEnabled: boolean;
  error?: string;
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


interface ARCoreNativeModule {
  checkSupport(): Promise<ARCoreSupport>;
  requestInstall(): Promise<{ installRequested?: boolean; alreadyInstalled?: boolean }>;
  startSession(): Promise<SessionStatus>;
  stopSession(): Promise<boolean>;
  updateFrame(): Promise<boolean>;
  hitTest(x: number, y: number): Promise<Vector3D | null>;
  getDetectedPlanes(): Promise<DetectedPlane[]>;
  distanceBetween(p1: Vector3D, p2: Vector3D): Promise<number>;
  getCameraPose(): Promise<CameraPose>;
}


const native = (NativeModules as Record<string, unknown>)['ARCoreModule'] as ARCoreNativeModule | undefined;
const isAndroid = Platform.OS === 'android';

const FALLBACK_SUPPORT: ARCoreSupport = { hasARCore: false, hasDepthAPI: false };


let eventEmitter: NativeEventEmitter | null = null;
if (native && isAndroid) {
  eventEmitter = new NativeEventEmitter(NativeModules.ARCoreModule);
}


export const ARCoreModule = {
  /** True if native module is available */
  isAvailable: isAndroid && !!native,

  /** Check if ARCore and Depth API are supported on this device */
  checkSupport: async (): Promise<ARCoreSupport> => {
    if (!native || !isAndroid) return FALLBACK_SUPPORT;
    try {
      return await native.checkSupport();
    } catch {
      return FALLBACK_SUPPORT;
    }
  },

  /** Request ARCore installation if needed */
  requestInstall: async (): Promise<{ installRequested?: boolean; alreadyInstalled?: boolean }> => {
    if (!native || !isAndroid) {
      throw new Error('ARCore not available on this platform');
    }
    return await native.requestInstall();
  },

  /** Start ARCore session */
  startSession: async (): Promise<SessionStatus> => {
    if (!native || !isAndroid) {
      return { success: false, depthEnabled: false, error: 'ARCore not available' };
    }
    try {
      return await native.startSession();
    } catch (e: any) {
      console.warn('[ARCore] startSession failed', e);
      return { success: false, depthEnabled: false, error: e.message };
    }
  },

  /** Stop/pause ARCore session */
  stopSession: async (): Promise<boolean> => {
    if (!native || !isAndroid) return false;
    try {
      return await native.stopSession();
    } catch (e: any) {
      console.warn('[ARCore] stopSession failed', e);
      return false;
    }
  },

  /** Update frame and get plane detections */
  updateFrame: async (): Promise<boolean> => {
    if (!native || !isAndroid) return false;
    try {
      return await native.updateFrame();
    } catch (e: any) {
      console.warn('[ARCore] updateFrame failed', e);
      return false;
    }
  },

  /** Perform hit test at screen coordinates (pixels) */
  hitTest: async (x: number, y: number): Promise<Vector3D | null> => {
    if (!native || !isAndroid) return null;
    try {
      return await native.hitTest(x, y);
    } catch {
      return null;
    }
  },

  /** Get currently detected planes */
  getDetectedPlanes: async (): Promise<DetectedPlane[]> => {
    if (!native || !isAndroid) return [];
    try {
      return await native.getDetectedPlanes();
    } catch {
      return [];
    }
  },

  /** Calculate real-world distance between two 3D points (in meters) */
  distanceBetween: async (p1: Vector3D, p2: Vector3D): Promise<number> => {
    if (!native || !isAndroid) {
      // Pure JS fallback
      return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)
      );
    }
    try {
      return await native.distanceBetween(p1, p2);
    } catch {
      return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)
      );
    }
  },

  /** Get current camera pose in world coordinates */
  getCameraPose: async (): Promise<CameraPose | null> => {
    if (!native || !isAndroid) return null;
    try {
      return await native.getCameraPose();
    } catch {
      return null;
    }
  },


  /** Listen for plane detection events */
  addPlanesDetectedListener: (callback: (event: PlaneDetectedEvent) => void) => {
    if (eventEmitter) {
      return eventEmitter.addListener('ARCorePlanesDetected', callback);
    }
    // Fallback for non-Android platforms - return dummy subscription
    return { remove: () => {} } as any;
  },

  /** Remove all listeners */
  removeAllListeners: () => {
    if (eventEmitter) {
      eventEmitter.removeAllListeners('ARCorePlanesDetected');
    }
  },
};


export async function getARCapabilities(): Promise<ARCoreSupport & { canRunAR: boolean }> {
  const support = await ARCoreModule.checkSupport();
  return {
    ...support,
    canRunAR: support.hasARCore,
  };
}


/**
 * Convert ARCore world coordinates to Blueprint 2D coordinates
 * ARCore: Y-up right-hand (X=east, Y=up, Z=toward viewer)
 * Blueprint: top-down 2D (X=east, Y=north)
 * Conversion: Blueprint Y = -ARCore Z
 */
export function toBlueprint2D(v: Vector3D): { x: number; y: number } {
  return {
    x: v.x,
    y: -v.z,
  };
}

/**
 * Snap value to grid (default 5cm)
 */
export function snapToGrid(value: number, gridSize = 0.05): number {
  return Math.round(value / gridSize) * gridSize;
}
