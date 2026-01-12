import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'simulation' | 'reel';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isSimulation: boolean;
  isReel: boolean;
  isBudget: boolean; // Alias for isSimulation
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('simulation');

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        isSimulation: mode === 'simulation',
        isReel: mode === 'reel',
        isBudget: mode === 'simulation', // Budget = simulation
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
