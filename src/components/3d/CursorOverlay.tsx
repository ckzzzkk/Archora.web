import React from 'react';
import { useCodesignStore } from '../../stores/codesignStore';
import { useSession } from '../../auth/useSession';

interface CursorOverlayProps {
  /**
   * Renders other participants' cursors as colored spheres in 3D world space.
   * Position: uses participant.cursorPosition world coords via R3F group position.
   * Color: uses participant.color from codesignStore.
   * Does NOT render the local user's own cursor.
   */
  _placeholder?: never;
}

/**
 * Renders other participants' cursors as colored spheres in 3D space.
 * Each cursor is a small sphere tinted with the participant's assigned color,
 * acting as a live presence indicator in the shared blueprint scene.
 */
export function CursorOverlay(_props: CursorOverlayProps) {
  const { user } = useSession();
  const session = useCodesignStore((s) => s.session);

  if (!session || !user) return null;

  const otherParticipants = session.participants.filter((p) => p.userId !== user.id);

  return (
    <>
      {otherParticipants.map((participant) => {
        const { x, y, z } = participant.cursorPosition;

        return (
          <group key={participant.userId} position={[x, y, z]}>
            {/* Cursor sphere — small 0.15m radius, tinted with participant color */}
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={participant.color}
                emissive={participant.color}
                emissiveIntensity={0.4}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
