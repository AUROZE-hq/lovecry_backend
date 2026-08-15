import DonateExperience from '@/components/donations/DonateExperience';
import ReceiptPolicyNotice from '@/components/donations/ReceiptPolicyNotice';
import { donationEnv } from '@/lib/config/env';

export const metadata = {
  title: 'Donate | LoveCry The Street Kids Organization',
  description:
    'Support LoveCry with a one-time or monthly donation. Stay on LoveCry.ca — payments are processed securely.',
};

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="bg-gradient-to-r from-[#693492] via-[#9a3d8f] to-[#f1328b] px-6 pb-12 pt-28 text-center sm:pb-14 sm:pt-32">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">Donate</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Give with confidence</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
          Every contribution helps youth and families heal, grow, and find community support.
        </p>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <DonateExperience
          defaultEmbedUrl={donationEnv.zeffy.defaultEmbedUrl}
          receiptNotice={<ReceiptPolicyNotice />}
        />
      </section>
    </main>
  );
}
