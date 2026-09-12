import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { getDonorPortalSummary } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell, { DONOR_PORTAL_NAV } from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';

export const metadata = { title: 'Giving History | LoveCry Donor Portal' };

export default async function DonorDonationsPage() {
  const donor = await getAuthenticatedDonor();
  if (!donor) redirect('/donor');

  const summary = await getDonorPortalSummary(donor.id);
  const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Donor';

  return (
    <PortalShell
      title="Giving History"
      subtitle="All of your LoveCry donations in one place."
      email={donor.email}
      displayName={name}
      nav={DONOR_PORTAL_NAV}
      activeHref="/donor/donations"
      logoutAction={logoutDonor}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total given" value={formatCadFromCents(summary.stats.totalGivenCents)} />
        <Stat
          label={`${summary.stats.year} gifts`}
          value={formatCadFromCents(summary.stats.yearGiftsCents)}
        />
        <Stat
          label="Active monthly"
          value={
            summary.stats.activeMonthlyCents > 0
              ? `${formatCadFromCents(summary.stats.activeMonthlyCents)} / month`
              : 'None'
          }
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="hidden grid-cols-[1.1fr_0.8fr_0.9fr_1.2fr_1fr] gap-3 border-b border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 md:grid">
          <span>Date</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Campaign</span>
          <span>Receipt</span>
        </div>
        <ul className="divide-y divide-white/10">
          {summary.donations.length === 0 && (
            <li className="px-5 py-8 text-sm text-white/50">No donations yet.</li>
          )}
          {summary.donations.map((d) => {
            const date = new Date(d.transactionDate || d.createdAt).toLocaleDateString('en-CA', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const receipt = summary.receipts.find((r) => r.donationId === d.id);
            return (
              <li
                key={d.id}
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1.1fr_0.8fr_0.9fr_1.2fr_1fr] md:items-center md:gap-3"
              >
                <span className="text-white/80">{date}</span>
                <span className="font-semibold text-white">{formatCadFromCents(d.amountCents)}</span>
                <span className="text-white/70">{d.frequency === 'MONTHLY' ? 'Monthly' : 'One-time'}</span>
                <span className="text-white/70">{d.campaignName}</span>
                <span>
                  {receipt ? (
                    <Link
                      href={`/donor/receipts/${receipt.id}`}
                      className="font-semibold text-[#f1328b] hover:underline"
                    >
                      View receipt
                    </Link>
                  ) : (
                    <span className="text-white/40">Confirmation</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </PortalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
