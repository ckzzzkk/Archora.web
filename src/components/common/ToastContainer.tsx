import React from 'react';
import { View } from 'react-native';
import { Toast } from './Toast';
import { useUIStore } from '../../stores/uiStore';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const hideToast = useUIStore((s) => s.actions.hideToast);

  if (toasts.length === 0) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onDismiss={() => hideToast(t.id)}
          duration={t.duration}
        />
      ))}
    </View>
  );
}
