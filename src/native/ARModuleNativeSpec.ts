/**
 * ARModule TurboModule Native Spec
 *
 * Shared TypeScript interface for AR capabilities on both iOS and Android.
 * Both ARKitModule (iOS) and ARCoreModule (Android) implement this spec.
 * Codegen uses this file to generate the native glue code for TurboModules.
 *
 * @nolint
 */

import type { TurboModule } from 'react-native';

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
  hasARCore: boolean;
  hasDepthAPI: boolean;
  hasLiDAR?: boolean;
  availability?: string;
  error?: string;
  deviceModel?: string;
}

export interface SessionStatus {
  success: boolean;
  depthEnabled: boolean;
  error?: string;
  lidarEnabled?: boolean;
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

export interface MeshVertex {
  x: number;
  y: number;
  z: number;
}

export interface MeshFace {
  indices: [number, number, number];
}

export interface PointCloudPoint {
  x: number;
  y: number;
  z: number;
  confidence?: number;
}

export interface MeshUpdateEvent {
  vertexCount: number;
  faceCount: number;
  boundingBox: [number, number, number, number, number, number]; // [minX, minY, minZ, maxX, maxY, maxZ]
}

export interface PlaneDetectedEvent {
  count: number;
}

// ── TurboModule Spec ───────────────────────────────────────────────────────────

export interface Spec extends TurboModule {
  // Synchronous info
  readonly isAvailable: boolean;

  // Device support check
  checkSupport(): Promise<ARSupport>;

  // Platform-specific: Android = requestInstall, iOS = requestCameraPermission
  requestCameraPermission?(): Promise<{ granted: boolean }>;
  requestInstall?(): Promise<{
    installRequested?: boolean;
    alreadyInstalled?: boolean;
  }>;

  // Session lifecycle
  startSession(): Promise<SessionStatus>;
  stopSession(): Promise<boolean>;
  updateFrame(): Promise<boolean>;

  // Spatial queries
  hitTest(x: number, y: number): Promise<Vector3D | null>;
  getDetectedPlanes(): Promise<DetectedPlane[]>;
  distanceBetween(p1: Vector3D, p2: Vector3D): Promise<number>;
  getCameraPose(): Promise<CameraPose | null>;

  // Optional: mesh vertices (LiDAR devices)
  getMeshVertices?(): Promise<MeshVertex[]>;
  getMeshFaces?(): Promise<MeshFace[]>;
  getPointCloud?(): Promise<PointCloudPoint[]>;

  // Event emitter support
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// ── Event Names (for JS-side registration) ─────────────────────────────────────

export const AR_EVENTS = {
  PLANES_DETECTED: 'onPlanesDetected',
  SESSION_INTERRUPTED: 'onSessionInterrupted',
  SESSION_RESUMED: 'onSessionResumed',
  MESH_UPDATED: 'onMeshUpdated',
} as const;