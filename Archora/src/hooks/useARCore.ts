import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ARCoreModule,
  getARCapabilities,
  ARCoreSupport,
  SessionStatus,
  Vector3D,
  DetectedPlane,
  CameraPose,
} from '../native/ARCoreModule';


interface ARCoreState {
  isAvailable: boolean;
  support: ARCoreSupport | null;
  isSessionActive: boolean;
  depthEnabled: boolean;
  error: string | null;
}

interface UseARCoreReturn {
  state: ARCoreState;
  detectedPlanes: DetectedPlane[];
  cameraPose: CameraPose | null;
  startSession: () => Promise<boolean>;
  stopSession: () => Promise<void>;
  hitTest: (x: number, y: number) => Promise<Vector3D | null>;
  getDetectedPlanes: () => Promise<DetectedPlane[]>;
  distanceBetween: (p1: Vector3D, p2: Vector3D) => Promise<number>;
  updateFrame: () => Promise<boolean>;
  getCameraPose: () => Promise<CameraPose | null>;
  refreshCapabilities: () => Promise<void>;
}


export function useARCore(): UseARCoreReturn {
  const [state, setState] = useState<ARCoreState>({
    isAvailable: ARCoreModule.isAvailable,
    support: null,
    isSessionActive: false,
    depthEnabled: false,
    error: null,
  });

  const [detectedPlanes, setDetectedPlanes] = useState<DetectedPlane[]>([]);
  const [cameraPose, setCameraPose] = useState<CameraPose | null>(null);

  const frameUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  // Initialize - check capabilities
  useEffect(() => {
    refreshCapabilities();

    return () => {
      isMounted.current = false;
      stopSession();
    };
  }, []);

  // Refresh capabilities
  const refreshCapabilities = useCallback(async () => {
    try {
      const support = await getARCapabilities();
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isAvailable: support.canRunAR,
          support: {
            hasARCore: support.hasARCore,
            hasDepthAPI: support.hasDepthAPI,
            availability: support.availability,
            error: support.error,
          },
        }));
      }
    } catch (e: any) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: e.message,
        }));
      }
    }
  }, []);

  // Start session
  const startSession = useCallback(async (): Promise<boolean> => {
    try {
      const status: SessionStatus = await ARCoreModule.startSession();

      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isSessionActive: status.success,
          depthEnabled: status.depthEnabled,
          error: status.error || null,
        }));
      }

      // Start frame update loop if session is active
      if (status.success && !frameUpdateInterval.current) {
        frameUpdateInterval.current = setInterval(async () => {
          const updated = await ARCoreModule.updateFrame();
          if (updated) {
            const planes = await ARCoreModule.getDetectedPlanes();
            if (isMounted.current) {
              setDetectedPlanes(planes);
            }
          }
        }, 100); // Update at 10fps
      }

      return status.success;
    } catch (e: any) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: e.message,
        }));
      }
      return false;
    }
  }, []);

  // Stop session
  const stopSession = useCallback(async (): Promise<void> => {
    // Stop frame updates
    if (frameUpdateInterval.current) {
      clearInterval(frameUpdateInterval.current);
      frameUpdateInterval.current = null;
    }

    try {
      await ARCoreModule.stopSession();
    } catch (e: any) {
      console.warn('[useARCore] Error stopping session:', e);
    }

    if (isMounted.current) {
      setState(prev => ({
        ...prev,
        isSessionActive: false,
        depthEnabled: false,
      }));
      setDetectedPlanes([]);
      setCameraPose(null);
    }
  }, []);

  // Hit test
  const hitTest = useCallback(
    async (x: number, y: number): Promise<Vector3D | null> => {
      if (!state.isSessionActive) return null;
      return await ARCoreModule.hitTest(x, y);
    },
    [state.isSessionActive]
  );

  // Get detected planes
  const getDetectedPlanes = useCallback(async (): Promise<DetectedPlane[]> => {
    if (!state.isSessionActive) return [];
    const planes = await ARCoreModule.getDetectedPlanes();
    if (isMounted.current) {
      setDetectedPlanes(planes);
    }
    return planes;
  }, [state.isSessionActive]);

  // Calculate distance
  const distanceBetween = useCallback(
    async (p1: Vector3D, p2: Vector3D): Promise<number> => {
      return await ARCoreModule.distanceBetween(p1, p2);
    },
    []
  );

  // Update frame (manual)
  const updateFrame = useCallback(async (): Promise<boolean> => {
    const updated = await ARCoreModule.updateFrame();
    if (updated) {
      const planes = await ARCoreModule.getDetectedPlanes();
      if (isMounted.current) {
        setDetectedPlanes(planes);
      }
    }
    return updated;
  }, []);

  // Get camera pose
  const getCameraPose = useCallback(async (): Promise<CameraPose | null> => {
    const pose = await ARCoreModule.getCameraPose();
    if (isMounted.current) {
      setCameraPose(pose);
    }
    return pose;
  }, []);

  return {
    state,
    detectedPlanes,
    cameraPose,
    startSession,
    stopSession,
    hitTest,
    getDetectedPlanes,
    distanceBetween,
    updateFrame,
    getCameraPose,
    refreshCapabilities,
  };
}


interface UseARCapabilitiesReturn {
  support: ARCoreSupport | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useARCapabilities(): UseARCapabilitiesReturn {
  const [support, setSupport] = useState<ARCoreSupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const caps = await getARCapabilities();
      if (isMounted.current) {
        setSupport(caps);
      }
    } catch (e: any) {
      console.warn('[useARCapabilities] Error:', e);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  return { support, isLoading, refresh };
}


interface UseARHitTestingReturn {
  lastHit: Vector3D | null;
  hitTest: (x: number, y: number) => Promise<Vector3D | null>;
  clear: () => void;
}

export function useARHitTesting(): UseARHitTestingReturn {
  const [lastHit, setLastHit] = useState<Vector3D | null>(null);

  const hitTest = useCallback(async (x: number, y: number): Promise<Vector3D | null> => {
    const result = await ARCoreModule.hitTest(x, y);
    setLastHit(result);
    return result;
  }, []);

  const clear = useCallback(() => {
    setLastHit(null);
  }, []);

  return { lastHit, hitTest, clear };
}


interface UseARPlanesReturn {
  planes: DetectedPlane[];
  wallPlanes: DetectedPlane[];
  floorPlanes: DetectedPlane[];
  refresh: () => Promise<void>;
}

export function useARPlanes(): UseARPlanesReturn {
  const [planes, setPlanes] = useState<DetectedPlane[]>([]);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    const detected = await ARCoreModule.getDetectedPlanes();
    if (isMounted.current) {
      setPlanes(detected);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  const wallPlanes = planes.filter(p => p.type === 'wall');
  const floorPlanes = planes.filter(p => p.type === 'floor');

  return {
    planes,
    wallPlanes,
    floorPlanes,
    refresh,
  };
}
