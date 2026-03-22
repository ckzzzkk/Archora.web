import React, { Suspense, lazy, ComponentType } from 'react';
import { LogoLoader } from '../components/common/LogoLoader';

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
      <Suspense fallback={<LogoLoader />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  }

  return LazyWrapper;
}
