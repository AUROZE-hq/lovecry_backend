'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type IntroContextValue = {
  isHomeIntroActive: boolean;
  startHomeIntro: () => void;
  completeHomeIntro: () => void;
};

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [isHomeIntroActive, setIsHomeIntroActive] = useState(true);

  const startHomeIntro = useCallback(() => {
    setIsHomeIntroActive(true);
  }, []);

  const completeHomeIntro = useCallback(() => {
    setIsHomeIntroActive(false);
  }, []);

  const value = useMemo(
    () => ({ isHomeIntroActive, startHomeIntro, completeHomeIntro }),
    [isHomeIntroActive, startHomeIntro, completeHomeIntro],
  );

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro() {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error('useIntro must be used within IntroProvider');
  }
  return context;
}
