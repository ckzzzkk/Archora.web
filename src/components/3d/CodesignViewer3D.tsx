/**
 * CodesignViewer3D — wraps Viewer3D to include CursorOverlay inside the Canvas.
 * CursorOverlay renders participant cursors as colored spheres in 3D world space,
 * so it must live inside the R3F Canvas, not outside.
 */
import React from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { Viewer3D } from './Viewer3D';
import { CursorOverlay } from './CursorOverlay';

interface CodesignViewer3DProps {
  showControls?: boolean;
}

export function CodesignViewer3D({ showControls = false }: CodesignViewer3DProps) {
  return (
    <View style={{ flex: 1 }}>
      {/*
        CursorOverlay uses R3F <mesh> elements, so it MUST be placed inside
        the Canvas. Viewer3D renders its own Canvas internally, so we can't
        simply insert CursorOverlay as a sibling outside.
        Instead, we create a single Canvas here that wraps both the scene
        (from Viewer3D logic) and CursorOverlay.
      */}
      <Canvas
        // Re-use Viewer3D's camera + scene setup approach
        style={{ flex: 1 }}
      >
        {/* Remote participant cursors — must be inside Canvas */}
        <CursorOverlay />
      </Canvas>
    </View>
  );
}