import { useState, useCallback, useRef } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { computeOrbitPreset, computeFirstPersonPreset, type CameraPreset } from '../utils/procedural/sceneHelpers';
import type { ViewMode } from '../types';

export interface Scene3DState {
  cameraPreset: CameraPreset | null;
  isRendering: boolean;
  fps: number;
  showGrid: boolean;
  showShadows: boolean;
  showFurniture: boolean;
  snapshot: string | null;
}

export interface Use3DSceneResult extends Scene3DState {
  setShowGrid: (v: boolean) => void;
  setShowShadows: (v: boolean) => void;
  setShowFurniture: (v: boolean) => void;
  resetCamera: () => void;
  setIsRendering: (v: boolean) => void;
  updateFps: (fps: number) => void;
  setSnapshot: (data: string | null) => void;
  activeCameraPreset: CameraPreset | null;
}

export function use3DScene(viewMode: ViewMode = '3D'): Use3DSceneResult {
  const blueprint = useBlueprintStore((s) => s.blueprint);

  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [fps, setFps] = useState(60);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const activeCameraPreset: CameraPreset | null = blueprint
    ? viewMode === 'FirstPerson'
      ? computeFirstPersonPreset(blueprint)
      : computeOrbitPreset(blueprint)
    : null;

  const resetCamera = useCallback(() => {
    // Trigger a re-render by toggling a state; actual camera reset is handled in Viewer3D
    setShowGrid((g) => g);
  }, []);

  const updateFps = useCallback((value: number) => {
    setFps(Math.round(value));
  }, []);

  return {
    cameraPreset: activeCameraPreset,
    isRendering,
    fps,
    showGrid,
    showShadows,
    showFurniture,
    snapshot,
    setShowGrid,
    setShowShadows,
    setShowFurniture,
    resetCamera,
    setIsRendering,
    updateFps,
    setSnapshot,
    activeCameraPreset,
  };
}
