import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import DonorLoginForm from '@/components/donor/DonorLoginForm';

export const metadata = { title: 'Donor Portal | LoveCry' };

export default async function DonorHomePage() {
  const donor = await getAuthenticatedDonor();
  if (donor) redirect('/donor/donations');

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-[calc(var(--site-header-height)+2rem)] text-white sm:px-6">
      <Suspense fallback={<p className="text-white/50">Loading…</p>}>
        <DonorLoginForm />
      </Suspense>
    </main>
  );
}
