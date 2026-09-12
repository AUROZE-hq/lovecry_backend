import DonateExperience from '@/components/donations/DonateExperience';
import { donationEnv } from '@/lib/config/env';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';

export const metadata = {
  title: 'Donate | LoveCry The Street Kids Organization',
  description:
    'Support LoveCry with a one-time or monthly donation. Stay on LoveCry.ca — payments are processed securely.',
};

export default async function DonatePage() {
  const donor = await getAuthenticatedDonor();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="px-4 pb-16 pt-[calc(var(--site-header-height)+2rem)] sm:px-6 sm:pb-20">
        <DonateExperience
          defaultEmbedUrl={donationEnv.zeffy.defaultEmbedUrl}
          receiptThresholdCents={donationEnv.charity.receiptThresholdCents}
          receiptingEnabled={donationEnv.charity.receiptingEnabled}
          authenticatedDonor={
            donor
              ? {
                  email: donor.email,
                  firstName: donor.firstName,
                  lastName: donor.lastName,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
