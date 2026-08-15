import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import { listDonations, getReceiptByDonationId } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';

const nav = [
  { href: '/donor/donations', label: 'History' },
  { href: '/donor/monthly', label: 'Monthly giving' },
  { href: '/donor/receipts', label: 'Receipts' },
  { href: '/donor/profile', label: 'Profile' },
];

export const metadata = { title: 'Donation History | LoveCry' };

export default async function DonorDonationsPage() {
  const email = (await cookies()).get(DONOR_COOKIE)?.value;
  if (!email) redirect('/donor');

  const mine = (await listDonations()).filter(
    (d) => d.email?.toLowerCase() === email.toLowerCase()
  );
  const mineWithReceipts = await Promise.all(
    mine.map(async (d) => ({
      donation: d,
      receipt: await getReceiptByDonationId(d.id),
    }))
  );

  return (
    <PortalShell
      title="Your donations"
      subtitle="Donor Portal"
      email={email}
      nav={nav}
      logoutAction={logoutDonor}
    >
      <ul className="space-y-3">
        {mineWithReceipts.map(({ donation: d, receipt }) => {
          return (
            <li key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {formatCadFromCents(d.amountCents)}
                    {d.frequency === 'MONTHLY' ? ' / month' : ''}
                  </p>
                  <p className="mt-1 text-sm text-white/55">{d.campaignName}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {d.status} · {d.reference} · {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {d.receiptStatus}
                </span>
              </div>
              {receipt && (
                <p className="mt-3 text-xs text-[#f1328b]">Receipt {receipt.receiptNumber}</p>
              )}
            </li>
          );
        })}
        {mine.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-white/45">
            No donations yet for this email.{' '}
            <Link href="/donate" className="text-[#f1328b] hover:underline">
              Make a gift
            </Link>
          </li>
        )}
      </ul>
    </PortalShell>
  );
}
