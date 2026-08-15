import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import DonorLoginForm from '@/components/donor/DonorLoginForm';

export const metadata = { title: 'Donor Portal | LoveCry' };

export default async function DonorHomePage() {
  const email = (await cookies()).get(DONOR_COOKIE)?.value;
  if (email) redirect('/donor/donations');

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <DonorLoginForm />
    </main>
  );
}
