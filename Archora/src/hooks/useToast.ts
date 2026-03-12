import { useUIStore } from '../stores/uiStore';

export function useToast() {
  const showToast = useUIStore((s) => s.actions.showToast);
  const hideToast = useUIStore((s) => s.actions.hideToast);
  return { showToast, hideToast };
}
