import React, { createContext, useContext, useState } from 'react';

interface TabDirectionContextValue {
  direction: 'left' | 'right' | 'none';
  setDirection: (d: 'left' | 'right' | 'none') => void;
}

export const TabDirectionContext = createContext<TabDirectionContextValue>({
  direction: 'none',
  setDirection: () => {},
});

export function TabDirectionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  return (
    <TabDirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </TabDirectionContext.Provider>
  );
}

export function useTabDirection() {
  return useContext(TabDirectionContext);
}
