import React, { Suspense, lazy, ComponentType } from 'react';
import { CompassRoseLoader } from '../components/common/CompassRoseLoader';

/**
 * Wraps React.lazy + Suspense with a LogoLoader fallback.
 * Designed for named exports — callers map to { default } in the factory.
 *
 * Usage:
 *   const MyScreen = lazyScreen(() =>
 *     import('../screens/MyScreen').then(m => ({ default: m.MyScreen }))
 *   );
 */
export function lazyScreen<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ComponentType<React.ComponentPropsWithRef<T>> {
  const LazyComponent = lazy(factory);

  function LazyWrapper(props: React.ComponentPropsWithRef<T>) {
    return (
      <Suspense fallback={<CompassRoseLoader />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  }

  return LazyWrapper;
}
