import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { buildRoofSegmentGeometry } from '../../utils/procedural/roofGeometry';
import type { Roof, RoofSegment, Vector3D } from '../../types';

// ---------------------------------------------------------------------------
// Material definitions
// ---------------------------------------------------------------------------

const ROOF_COLORS = {
  wall: '#8B7355',      // wood/brown for rake edges and walls
  edge: '#6B5B4F',      // darker trim for edge material
  innerVoid: '#4A3F35', // dark inner void (not typically visible)
  shingle: '#3D3D3D',   // dark asphalt shingle / roof deck
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProceduralRoofProps {
  roof: Roof;
  segments: RoofSegment[];
  selected?: boolean;
  opacity?: number;
  onSelect?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function positionFromVector3D(v: Vector3D): [number, number, number] {
  return [v.x, v.y, v.z];
}

// ---------------------------------------------------------------------------
// ProceduralRoof
// ---------------------------------------------------------------------------

export function ProceduralRoof({
  roof,
  segments,
  selected = false,
  opacity = 1,
  onSelect,
}: ProceduralRoofProps) {
  // Filter segments belonging to this roof
  const roofSegments = useMemo(
    () => segments.filter((s) => roof.children.includes(s.id)),
    [segments, roof.children],
  );

  // Build geometry for each segment
  const geometries = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];

    for (const segment of roofSegments) {
      const result = buildRoofSegmentGeometry(segment);
      geos.push(result.geometry);
    }

    return geos;
  }, [roofSegments]);

  // Memoize the materials array to avoid re-creation on each render
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({
        color: ROOF_COLORS.wall,
        roughness: 0.9,
        metalness: 0.0,
        transparent: opacity < 1,
        opacity,
      }),
      new THREE.MeshStandardMaterial({
        color: ROOF_COLORS.edge,
        roughness: 0.85,
        metalness: 0.05,
        transparent: opacity < 1,
        opacity,
      }),
      new THREE.MeshStandardMaterial({
        color: ROOF_COLORS.innerVoid,
        roughness: 0.95,
        metalness: 0.0,
        transparent: opacity < 1,
        opacity,
      }),
      new THREE.MeshStandardMaterial({
        color: ROOF_COLORS.shingle,
        roughness: 0.8,
        metalness: 0.05,
        transparent: opacity < 1,
        opacity,
      }),
    ],
    [opacity],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    if (onSelect) onSelect(roof.id);
  }, [onSelect, roof.id]);

  const pos = positionFromVector3D(roof.position);

  if (geometries.length === 0) return null;

  return (
    <group
      position={pos}
      rotation={[0, roof.rotation, 0]}
      // @ts-ignore R3F group supports onClick
      onClick={handleClick}
    >
      {geometries.map((geo, geoIndex) => (
        <mesh
          key={`${roof.id}-geo-${geoIndex}`}
          // @ts-expect-error R3F mesh supports geometry prop
          geometry={geo}
          material={materials}
          castShadow
          receiveShadow
        />
      ))}

      {/* Selection highlight */}
      {selected && geometries.length > 0 && (
        <mesh
          // @ts-expect-error R3F mesh supports geometry prop
          geometry={geometries[0]}
        >
          <meshBasicMaterial
            color="#00BFFF"
            transparent
            opacity={0.15 * opacity}
            wireframe={false}
            // @ts-expect-error depthWrite is valid on MeshBasicMaterial
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Material getter for external use
// ---------------------------------------------------------------------------

export function getRoofMaterials(opacity = 1): THREE.MeshStandardMaterial[] {
  return [
    new THREE.MeshStandardMaterial({
      color: ROOF_COLORS.wall,
      roughness: 0.9,
      metalness: 0.0,
      transparent: opacity < 1,
      opacity,
    }),
    new THREE.MeshStandardMaterial({
      color: ROOF_COLORS.edge,
      roughness: 0.85,
      metalness: 0.05,
      transparent: opacity < 1,
      opacity,
    }),
    new THREE.MeshStandardMaterial({
      color: ROOF_COLORS.innerVoid,
      roughness: 0.95,
      metalness: 0.0,
      transparent: opacity < 1,
      opacity,
    }),
    new THREE.MeshStandardMaterial({
      color: ROOF_COLORS.shingle,
      roughness: 0.8,
      metalness: 0.05,
      transparent: opacity < 1,
      opacity,
    }),
  ];
}
