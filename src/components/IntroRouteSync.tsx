'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useIntro } from '@/context/IntroContext';

export default function IntroRouteSync() {
  const pathname = usePathname();
  const { completeHomeIntro } = useIntro();

  useEffect(() => {
    if (pathname !== '/') {
      completeHomeIntro();
    }
  }, [pathname, completeHomeIntro]);

  return null;
}
