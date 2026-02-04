import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'budget' | 'reel';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isBudget: boolean;
  isReel: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('budget');

  console.log('[ModeContext] Current mode:', mode);

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        isBudget: mode === 'budget',
        isReel: mode === 'reel',
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
