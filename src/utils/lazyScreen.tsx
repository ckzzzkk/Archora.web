import React, { Suspense, lazy, ComponentType } from 'react';
import { CompassRoseLoader } from '../components/common/CompassRoseLoader';

/**
 * Wraps React.lazy + Suspense with a CompassRoseLoader fallback.
 * Designed for named exports — callers map to { default } in the factory.
 *
 * Usage:
 *   const MyScreen = lazyScreen(() =>
 *     import('../screens/MyScreen').then(m => ({ default: m.MyScreen }))
 *   );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyScreen<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ComponentType<React.ComponentPropsWithRef<T>> {
  const LazyComponent = lazy(factory);

  function LazyWrapper(props: React.ComponentPropsWithRef<T>) {
    return (
      <Suspense fallback={<CompassRoseLoader />}>
        {/* LazyExoticComponent props are invariant; cast required due to Suspense/lazy generics */}
        <LazyComponent {...(props as React.ComponentProps<T>)} />
      </Suspense>
    );
  }

  return LazyWrapper;
}
