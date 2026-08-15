import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { listDonations } from '@/lib/donations/store';

export const metadata = { title: 'Donors Admin | LoveCry' };

export default async function AdminDonorsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');

  const donors = new Map<string, { email: string; name: string; gifts: number }>();
  for (const d of await listDonations()) {
    if (!d.email) continue;
    const existing = donors.get(d.email) ?? {
      email: d.email,
      name: [d.firstName, d.lastName].filter(Boolean).join(' ') || '—',
      gifts: 0,
    };
    existing.gifts += 1;
    donors.set(d.email, existing);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/donations" className="text-sm text-[#f1328b]">
          ← Donations
        </Link>
        <h1 className="mt-4 text-3xl font-black">Donors</h1>
        <ul className="mt-8 space-y-3">
          {Array.from(donors.values()).map((d) => (
            <li key={d.email} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-white/55">{d.email}</p>
              <p className="mt-1 text-xs text-white/40">{d.gifts} gift(s)</p>
            </li>
          ))}
          {donors.size === 0 && <p className="text-white/40">No donor emails recorded yet.</p>}
        </ul>
      </div>
    </main>
  );
}
