import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { DEFAULT_CAMPAIGNS } from '@/lib/donations/campaigns';
import { listDonations } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';

export const metadata = { title: 'Campaigns Admin | LoveCry' };

export default async function AdminCampaignsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const donations = await listDonations();

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/donations" className="text-sm text-[#f1328b]">
          ← Donations
        </Link>
        <h1 className="mt-4 text-3xl font-black">Campaigns</h1>
        <div className="mt-8 space-y-4">
          {DEFAULT_CAMPAIGNS.map((c) => {
            const paid = donations.filter(
              (d) => d.campaignSlug === c.slug && d.status === 'PAID'
            );
            const raised = paid.reduce((s, d) => s + d.amountCents, 0);
            return (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{c.name}</h2>
                    <p className="mt-1 text-sm text-white/55">{c.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#f1328b]">{formatCadFromCents(raised)}</p>
                </div>
                <p className="mt-3 text-xs text-white/35">
                  Embed: {c.embedUrl || 'not set — uses ZEFFY_DEFAULT_EMBED_URL'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
