import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { getReceiptForDonor } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { orgInfo } from '@/lib/org-info';
import PortalShell, { DONOR_PORTAL_NAV } from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';

type Props = { params: Promise<{ id: string }> };

export default async function DonorReceiptDetailPage({ params }: Props) {
  const donor = await getAuthenticatedDonor();
  if (!donor) redirect('/donor');

  const { id } = await params;
  const receipt = await getReceiptForDonor(id, donor.id);
  if (!receipt) notFound();

  const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Donor';
  const d = receipt.donation;

  return (
    <PortalShell
      title="Receipt detail"
      subtitle={receipt.receiptNumber}
      email={donor.email}
      displayName={name}
      nav={DONOR_PORTAL_NAV}
      activeHref="/donor/receipts"
      logoutAction={logoutDonor}
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="Receipt number" value={receipt.receiptNumber} />
          <Item label="Status" value={receipt.status} />
          <Item label="Donor" value={name} />
          <Item
            label="Donation date"
            value={new Date(d.transactionDate || d.createdAt).toLocaleDateString('en-CA', {
              dateStyle: 'long',
            })}
          />
          <Item label="Eligible amount" value={formatCadFromCents(receipt.eligibleAmountCents)} />
          <Item label="Campaign" value={d.campaignName} />
          <Item label="Charity number" value={orgInfo.charityNumber} />
          <Item label="Email" value={d.email || donor.email} />
        </dl>
        <p className="mt-6 text-sm text-white/50">
          Official receipts are emailed when available. Contact LoveCry if you need a replacement copy.
        </p>
        <Link href="/donor/receipts" className="mt-6 inline-flex text-sm font-semibold text-[#f1328b]">
          ← Back to receipts
        </Link>
      </div>
    </PortalShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}
