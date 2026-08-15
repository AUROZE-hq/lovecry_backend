import Link from 'next/link';
import { Heart } from 'lucide-react';
import { getDonationStatus } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { donationEnv } from '@/lib/config/env';
import { orgInfo } from '@/lib/org-info';

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

  // Trust server store / future Zeffy sync — not query string alone
  const verified = refParam ? await getDonationStatus(refParam) : null;
  const paid = verified?.donation.status === 'PAID';

  const amountLabel = paid
    ? formatCadFromCents(verified!.donation.amountCents)
    : typeof params.amount === 'string'
      ? params.amount
      : null;

  const campaignLabel = paid
    ? verified!.donation.campaignName
    : typeof params.campaign === 'string'
      ? params.campaign
      : null;

  let receiptMessage: string;
  if (!paid) {
    receiptMessage =
      'We could not verify this donation yet. If you just paid, your confirmation will appear once LoveCry syncs the Zeffy transaction.';
  } else if (!donationEnv.charity.receiptingEnabled) {
    receiptMessage =
      'Your donation was successful. A donation acknowledgement has been emailed when an address was provided. This is not an official charitable tax receipt.';
  } else if (verified!.eligibility.eligible) {
    if (verified!.donation.receiptStatus === 'GENERATED' || verified!.donation.receiptStatus === 'EMAILED') {
      receiptMessage = `Your official charitable donation receipt (${verified!.donation.receiptNumber}) has been prepared and emailed when possible.`;
    } else {
      receiptMessage =
        'Your donation was successful. Your official receipt is being prepared and will be emailed to you.';
    }
  } else {
    receiptMessage = `Thank you for your donation. A confirmation has been sent when an email was provided. Under LoveCry's receipting policy, official charitable donation receipts are issued for eligible donations of $${(donationEnv.charity.receiptThresholdCents / 100).toFixed(0)} or more.`;
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white sm:pt-32">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#693492] to-[#f1328b]">
          <Heart className="h-6 w-6 fill-white text-white" />
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
          {paid ? 'Thank you for your gift' : 'Checking your donation'}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/65">
          Your support helps {orgInfo.shortName} create safer, stronger spaces for youth and families.
        </p>

        <div className="mt-8 space-y-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-left text-sm text-white/70">
          {amountLabel && (
            <p>
              <span className="text-white/40">Amount: </span>
              {amountLabel}
              {paid && verified!.donation.frequency === 'MONTHLY' ? ' / month' : ''}
            </p>
          )}
          {campaignLabel && (
            <p>
              <span className="text-white/40">Campaign: </span>
              {campaignLabel}
            </p>
          )}
          {refParam && (
            <p>
              <span className="text-white/40">Reference: </span>
              {refParam}
            </p>
          )}
          {paid && (
            <p>
              <span className="text-white/40">Status: </span>
              Verified paid
            </p>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left text-sm leading-relaxed text-white/70">
          <p>{receiptMessage}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-8 py-3.5 text-sm font-bold text-white"
          >
            Return home
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-bold text-white/80 hover:text-white"
          >
            Donate again
          </Link>
          <Link
            href="/donor"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-bold text-white/80 hover:text-white"
          >
            Donor portal
          </Link>
        </div>
      </div>
    </main>
  );
}
