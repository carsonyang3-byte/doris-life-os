import { createContext, useContext, ReactNode } from 'react';
import { useVisionEngine } from './useVisionEngine';

type VisionEngineReturn = ReturnType<typeof useVisionEngine>;

const VisionEngineContext = createContext<VisionEngineReturn | null>(null);

export function VisionEngineProvider({ children }: { children: ReactNode }) {
  const engine = useVisionEngine();
  return (
    <VisionEngineContext.Provider value={engine}>
      {children}
    </VisionEngineContext.Provider>
  );
}

export function useVisionEngineShared(): VisionEngineReturn {
  const ctx = useContext(VisionEngineContext);
  if (!ctx) {
    throw new Error('useVisionEngineShared must be used within VisionEngineProvider');
  }
  return ctx;
}
