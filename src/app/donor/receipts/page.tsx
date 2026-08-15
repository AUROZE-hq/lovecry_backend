import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import { listDonations, listReceipts } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';
import { donationEnv } from '@/lib/config/env';

const nav = [
  { href: '/donor/donations', label: 'History' },
  { href: '/donor/monthly', label: 'Monthly giving' },
  { href: '/donor/receipts', label: 'Receipts' },
  { href: '/donor/profile', label: 'Profile' },
];

export const metadata = { title: 'Receipts | LoveCry Donor Portal' };

export default async function DonorReceiptsPage() {
  const email = (await cookies()).get(DONOR_COOKIE)?.value;
  if (!email) redirect('/donor');

  const mine = (await listDonations()).filter(
    (d) => d.email?.toLowerCase() === email.toLowerCase()
  );
  const ids = new Set(mine.map((d) => d.id));
  const receipts = (await listReceipts()).filter((r) => ids.has(r.donationId));

  return (
    <PortalShell
      title="Receipts"
      subtitle="Donor Portal"
      email={email}
      nav={nav}
      logoutAction={logoutDonor}
    >
      {!donationEnv.charity.receiptingEnabled && (
        <p className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/60">
          Official charitable tax receipts are currently disabled. You still receive donation
          acknowledgements by email when configured. Acknowledgements are not official tax receipts.
        </p>
      )}

      <ul className="space-y-3">
        {receipts.map((r) => (
          <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="font-mono text-sm font-semibold">{r.receiptNumber}</p>
            <p className="mt-1 text-sm text-white/55">
              {formatCadFromCents(r.eligibleAmountCents)} · {r.type} · {r.status}
            </p>
            {r.issuedAt && (
              <p className="mt-1 text-xs text-white/35">
                Issued {new Date(r.issuedAt).toLocaleString()}
              </p>
            )}
          </li>
        ))}
        {receipts.length === 0 && (
          <li className="text-white/45">
            No official receipts yet. Eligible gifts of $
            {(donationEnv.charity.receiptThresholdCents / 100).toFixed(0)}+ appear here when
            receipting is enabled.
          </li>
        )}
      </ul>
    </PortalShell>
  );
}
