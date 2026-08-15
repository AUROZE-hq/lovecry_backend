'use client';

import { useEffect, useState } from 'react';

const tabs = [
  { id: 'upcoming', href: '#upcoming', label: 'Upcoming Events' },
  { id: 'past', href: '#past', label: 'Past Events & Impact' },
] as const;

export default function EventsTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('upcoming');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'past') setActive('past');
      if (hash === 'upcoming') setActive('upcoming');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <div
      className="mt-8 grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:mt-10 sm:flex sm:w-auto sm:flex-wrap sm:gap-3"
      role="tablist"
      aria-label="Events sections"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <a
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            aria-controls={tab.id}
            onClick={() => setActive(tab.id)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-3 text-center text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#693492] sm:px-5 sm:text-sm ${
              selected
                ? 'bg-[#693492] text-white shadow-sm'
                : 'border border-[#693492] bg-white text-[#693492] hover:bg-[#693492]/5'
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
