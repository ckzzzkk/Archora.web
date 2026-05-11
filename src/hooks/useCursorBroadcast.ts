import { useEffect, useRef } from 'react';
import { useCodesignStore } from '../stores/codesignStore';
import { publishCursorUpdate } from '../services/codesignService';
import { useSession } from '../auth/useSession';

const BROADCAST_INTERVAL_MS = 100; // 10fps

export function useCursorBroadcast() {
  const { user } = useSession();
  const session = useCodesignStore((s) => s.session);
  const localCursor = useCodesignStore((s) => s.localCursor);
  const lastBroadcastRef = useRef<number>(0);
  const cursorRef = useRef(localCursor);

  // Keep cursor ref in sync
  cursorRef.current = localCursor;

  useEffect(() => {
    if (!session || !user) return;

    const sessionId = session.id;
    const userId = user.id;

    let animFrame: number;

    function scheduleNext() {
      animFrame = requestAnimationFrame(() => {
        const now = Date.now();
        const cursor = cursorRef.current;
        if (now - lastBroadcastRef.current >= BROADCAST_INTERVAL_MS) {
          lastBroadcastRef.current = now;
          publishCursorUpdate(sessionId, userId, cursor).catch((e) => {
            console.warn('[useCursorBroadcast] Cursor publish failed:', e);
          });
        }
        scheduleNext();
      });
    }

    scheduleNext();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [session, user]);
}
