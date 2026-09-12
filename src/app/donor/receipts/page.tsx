import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { getDonorPortalSummary } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell, { DONOR_PORTAL_NAV } from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';

export const metadata = { title: 'Receipts | LoveCry Donor Portal' };

export default async function DonorReceiptsPage() {
  const donor = await getAuthenticatedDonor();
  if (!donor) redirect('/donor');
  const summary = await getDonorPortalSummary(donor.id);
  const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Donor';

  return (
    <PortalShell
      title="Receipts"
      subtitle="Official receipts and donation confirmations."
      email={donor.email}
      displayName={name}
      nav={DONOR_PORTAL_NAV}
      activeHref="/donor/receipts"
      logoutAction={logoutDonor}
    >
      <ul className="space-y-3">
        {summary.receipts.length === 0 && (
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/50">
            No official receipts yet. Confirmations for gifts under the receipt threshold appear in
            Giving History.
          </li>
        )}
        {summary.receipts.map((r) => {
          const donation = summary.donations.find((d) => d.id === r.donationId);
          return (
            <li key={r.id}>
              <Link
                href={`/donor/receipts/${r.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-[#f1328b]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-white">{r.receiptNumber}</p>
                  <p className="text-sm text-[#f1328b]">View receipt</p>
                </div>
                <p className="mt-2 text-sm text-white/55">
                  {formatCadFromCents(r.eligibleAmountCents)}
                  {donation ? ` • ${donation.campaignName}` : ''}
                  {r.issuedAt
                    ? ` • ${new Date(r.issuedAt).toLocaleDateString('en-CA')}`
                    : ''}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
