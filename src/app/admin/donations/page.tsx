import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { requirePermission, AuthError } from '@/lib/auth/permissions';
import { getZeffyStatus } from '@/lib/zeffy';
import { donationEnv } from '@/lib/config/env';
import { logoutAdmin } from '@/app/admin/actions';
import { getAdminDonationStats } from '@/lib/donations/service';
import { listAudits, listDonations, listReceipts } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import { runZeffySync } from '@/lib/zeffy/sync';

export const metadata = {
  title: 'Donations Admin | LoveCry',
};

export default async function AdminDonationsPage() {
  const unlocked = await isAdminUnlocked();
  if (!unlocked) redirect('/admin');

  const zeffy = getZeffyStatus();
  const stats = await getAdminDonationStats();
  const donations = (await listDonations()).slice(0, 25);
  const receipts = (await listReceipts()).slice(0, 10);
  const audits = await listAudits(12);

  async function syncAction() {
    'use server';
    try {
      await requirePermission('donations.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    await runZeffySync();
    redirect('/admin/donations');
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Donations admin</h1>
            <p className="mt-2 text-sm text-white/55">Temporary password-gated dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/events"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70"
            >
              Events
            </Link>
            <Link
              href="/admin/counselling"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70"
            >
              Counselling
            </Link>
            <Link
              href="/admin/donors"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70"
            >
              Donors
            </Link>
            <Link
              href="/admin/campaigns"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70"
            >
              Campaigns
            </Link>
            <Link
              href="/admin/receipts"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70"
            >
              Receipts
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Raised', value: formatCadFromCents(stats.raisedCents) },
            { label: 'Paid gifts', value: String(stats.paidCount) },
            { label: 'Receipts issued', value: String(stats.receiptsIssued) },
            { label: 'Below $20 paid', value: String(stats.belowThreshold) },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] uppercase tracking-widest text-white/40">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-white/90">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-bold">Recent donations</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="py-2 pr-3">Ref</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-white/40">
                        No donations yet. Use the test flow on `/donate`.
                      </td>
                    </tr>
                  )}
                  {donations.map((d) => (
                    <tr key={d.id} className="border-t border-white/5 text-white/75">
                      <td className="py-3 pr-3 font-mono text-xs">{d.reference}</td>
                      <td className="py-3 pr-3">{formatCadFromCents(d.amountCents)}</td>
                      <td className="py-3 pr-3">{d.status}</td>
                      <td className="py-3">{d.receiptStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-bold">Zeffy</h2>
              <p className="mt-2 text-sm text-white/60">{zeffy.message}</p>
              <form action={syncAction} className="mt-4">
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                >
                  Run sync now
                </button>
              </form>
              <p className="mt-3 text-xs text-white/40">
                Receipting:{' '}
                <strong className="text-white/70">
                  {donationEnv.charity.receiptingEnabled ? 'enabled' : 'disabled'}
                </strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-bold">Receipts</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                {receipts.length === 0 && <li className="text-white/40">None issued yet.</li>}
                {receipts.map((r) => (
                  <li key={r.id} className="font-mono text-xs">
                    {r.receiptNumber} · {r.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-bold">Audit log</h2>
          <ul className="mt-3 space-y-2 text-xs text-white/55">
            {audits.map((a) => (
              <li key={a.id}>
                <span className="text-white/35">{new Date(a.createdAt).toLocaleString()}</span> — {a.action}
                {a.detail ? ` (${a.detail})` : ''}
              </li>
            ))}
            {audits.length === 0 && <li className="text-white/40">No events yet.</li>}
          </ul>
        </div>
      </div>
    </main>
  );
}
