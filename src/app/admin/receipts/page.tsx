import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { listReceipts, getDonationById } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';

export const metadata = { title: 'Receipts Admin | LoveCry' };

export default async function AdminReceiptsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const receipts = await listReceipts();
  const receiptsWithDonations = await Promise.all(
    receipts.map(async (r) => ({
      receipt: r,
      donation: await getDonationById(r.donationId),
    }))
  );

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/donations" className="text-sm text-[#f1328b]">
          ← Donations
        </Link>
        <h1 className="mt-4 text-3xl font-black">Receipts</h1>
        <ul className="mt-8 space-y-3">
          {receiptsWithDonations.map(({ receipt: r, donation }) => {
            return (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="font-mono text-sm font-semibold">{r.receiptNumber}</p>
                <p className="mt-1 text-sm text-white/55">
                  {formatCadFromCents(r.eligibleAmountCents)} · {r.type} · {r.status}
                </p>
                {donation && (
                  <p className="mt-1 text-xs text-white/35">Donation {donation.reference}</p>
                )}
              </li>
            );
          })}
          {receipts.length === 0 && (
            <p className="text-white/40">
              No official receipts yet. Enable CHARITY_RECEIPTING_ENABLED and donate $20+ to test.
            </p>
          )}
        </ul>
      </div>
    </main>
  );
}
