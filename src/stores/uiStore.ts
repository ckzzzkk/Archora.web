import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export type ModalId = 'upgrade' | 'delete-confirm' | 'share' | 'export' | 'settings' | 'ai-options' | 'edit_limit_reached';

interface UIState {
  toasts: ToastMessage[];
  activeModal: ModalId | null;
  modalData: Record<string, unknown>;
  isKeyboardVisible: boolean;
  bottomSheetSnapIndex: number;
  generationProgress: number; // 0–1
  primaryColor: string; // synced from useTheme for reactive cross-component updates

  actions: {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
    clearToasts: () => void;
    openModal: (id: ModalId, data?: Record<string, unknown>) => void;
    closeModal: () => void;
    setKeyboardVisible: (visible: boolean) => void;
    setBottomSheetSnap: (index: number) => void;
    setGenerationProgress: (progress: number) => void;
    setPrimaryColor: (color: string) => void;
  };
}

let toastCounter = 0;
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  activeModal: null,
  modalData: {},
  isKeyboardVisible: false,
  bottomSheetSnapIndex: 0,
  generationProgress: 0,
  primaryColor: '#C8C8C8', // default: drafting theme primary

  actions: {
    showToast: (message, type = 'info', duration = 3000) => {
      const id = `toast_${++toastCounter}`;
      const timer = setTimeout(() => {
        get().actions.hideToast(id);
        toastTimers.delete(id);
      }, duration);
      toastTimers.set(id, timer);
      const toast: ToastMessage = { id, message, type, duration };
      set((s) => ({ toasts: [...s.toasts, toast] }));
    },

    hideToast: (id) => {
      const timer = toastTimers.get(id);
      if (timer) { clearTimeout(timer); toastTimers.delete(id); }
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },

    clearToasts: () => set({ toasts: [] }),

    openModal: (id, data = {}) => set({ activeModal: id, modalData: data }),

    closeModal: () => set({ activeModal: null, modalData: {} }),

    setKeyboardVisible: (visible) => set({ isKeyboardVisible: visible }),

    setBottomSheetSnap: (index) => set({ bottomSheetSnapIndex: index }),

    setGenerationProgress: (progress) => set({ generationProgress: progress }),

    setPrimaryColor: (color) => set({ primaryColor: color }),
  },
}));
