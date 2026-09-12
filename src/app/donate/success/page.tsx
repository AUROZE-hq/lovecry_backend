import Link from 'next/link';
import { Check } from 'lucide-react';
import { getDonationStatus } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { donationEnv } from '@/lib/config/env';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import ActivatePortalCard from '@/components/donations/ActivatePortalCard';

export const metadata = {
  title: 'Thank You | LoveCry Donation',
  description: 'Thank you for supporting LoveCry The Street Kids Organization.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const refParam = typeof params.ref === 'string' ? params.ref : null;
  const verified = refParam ? await getDonationStatus(refParam) : null;
  const paid = verified?.donation.status === 'PAID';
  const sessionDonor = await getAuthenticatedDonor();

  if (!paid || !verified) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-[calc(var(--site-header-height)+2rem)] text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-3xl font-black">Checking your donation</h1>
          <p className="mt-3 text-white/60">
            We could not verify this donation yet. If you just paid, return here with your confirmation
            reference once LoveCry syncs the Zeffy transaction.
          </p>
          <Link href="/donate" className="mt-6 inline-flex text-[#f1328b] hover:underline">
            ← Back to donate
          </Link>
        </div>
      </main>
    );
  }

  const d = verified.donation;
  const first = d.firstName || 'friend';
  const amount = formatCadFromCents(d.amountCents);
  const isMonthly = d.frequency === 'MONTHLY';
  const underThreshold = !verified.eligibility.eligible;
  const alreadyAuthed = Boolean(sessionDonor);
  const existingPortal = verified.portalExists;

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-[calc(var(--site-header-height)+2rem)] text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">Thank you</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-300 sm:text-5xl">
            Your gift is already making a difference.
          </h1>
          <p className="mt-4 text-base text-white/70">
            Thank you for supporting LoveCry&apos;s healing-centred work.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">
            Your confirmation is saved in LoveCry. Use Donor Portal whenever you want to see giving
            history and eligible receipts. Share LoveCry or return home whenever you&apos;re ready.
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-400/25 bg-emerald-950/30 p-6 shadow-[0_0_40px_rgba(16,185,129,0.12)] sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-black text-white">Thank you, {first}</h2>
          <p className="mt-2 text-center text-emerald-200/80">
            Your {amount}
            {isMonthly ? ' monthly' : ''} donation was successful.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-3xl font-black text-emerald-300">
              {amount} CAD{isMonthly ? ' / month' : ''}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {isMonthly ? 'Monthly' : 'One-time'} • {d.campaignName}
            </p>
            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-white/55">
              <p>
                Confirmation /{' '}
                {d.confirmationEmailStatus === 'SENT' || d.confirmationEmailStatus === 'SKIPPED'
                  ? `Sent to ${d.email}`
                  : 'Being prepared'}
              </p>
              <p>
                Receipt /{' '}
                {underThreshold
                  ? 'Email confirmation only (under receipt threshold)'
                  : d.receiptNumber
                    ? `Eligible receipt ${d.receiptNumber}`
                    : 'Eligible receipt being prepared'}
              </p>
            </div>
          </div>

          {!alreadyAuthed && (
            <div className="mt-5">
              {existingPortal ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">
                    Existing account detected
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">Welcome back</h3>
                  <p className="mt-2 text-sm text-white/55">
                    Today&apos;s gift is linked to your existing Donor Portal. Sign in to see updated
                    giving history.
                  </p>
                  <Link
                    href={`/donor?ref=${encodeURIComponent(d.reference)}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold text-white"
                  >
                    Sign in to Donor Portal
                  </Link>
                </div>
              ) : (
                <ActivatePortalCard
                  email={d.email || ''}
                  donationReference={d.reference}
                  amountLabel={amount}
                />
              )}
            </div>
          )}

          {alreadyAuthed && (
            <Link
              href="/donor/donations"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold text-white"
            >
              View giving history
            </Link>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80"
            >
              Return Home
            </Link>
            <Link
              href="/donate"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80"
            >
              Share LoveCry
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
