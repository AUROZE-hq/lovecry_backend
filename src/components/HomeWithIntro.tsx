'use client';

import { useEffect, useState } from 'react';
import LoadingIntro from '@/components/LoadingIntro';
import { useIntro } from '@/context/IntroContext';

type HomeWithIntroProps = {
  children: React.ReactNode;
};

export default function HomeWithIntro({ children }: HomeWithIntroProps) {
  const { startHomeIntro, completeHomeIntro } = useIntro();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    startHomeIntro();

    return () => {
      completeHomeIntro();
    };
  }, [startHomeIntro, completeHomeIntro]);

  const handleIntroComplete = () => {
    completeHomeIntro();
  };

  const handleIntroExitComplete = () => {
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && (
        <LoadingIntro
          onComplete={handleIntroComplete}
          onExitComplete={handleIntroExitComplete}
        />
      )}
      {children}
    </>
  );
}
