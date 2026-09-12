import { Suspense } from 'react';
import BookNowWizard from '@/components/counselling/BookNowWizard';

export const metadata = {
  title: 'Book Now | LoveCry Counselling',
  description: 'Book a LoveCry counselling appointment online without leaving lovecry.ca.',
};

export default function BookNowPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+2rem)] text-white/55">
          Loading booking…
        </main>
      }
    >
      <BookNowWizard />
    </Suspense>
  );
}
