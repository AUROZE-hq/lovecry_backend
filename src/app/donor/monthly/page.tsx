import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import { listDonations } from '@/lib/donations/store';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';

const nav = [
  { href: '/donor/donations', label: 'History' },
  { href: '/donor/monthly', label: 'Monthly giving' },
  { href: '/donor/receipts', label: 'Receipts' },
  { href: '/donor/profile', label: 'Profile' },
];

export const metadata = { title: 'Monthly Giving | LoveCry' };

export default async function DonorMonthlyPage() {
  const email = (await cookies()).get(DONOR_COOKIE)?.value;
  if (!email) redirect('/donor');

  const monthly = (await listDonations()).filter(
    (d) => d.email?.toLowerCase() === email.toLowerCase() && d.frequency === 'MONTHLY'
  );

  return (
    <PortalShell
      title="Monthly giving"
      subtitle="Donor Portal"
      email={email}
      nav={nav}
      logoutAction={logoutDonor}
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/65">
        <p>
          Track your recurring gifts here. When Zeffy is connected tomorrow, cancel/update links will
          point to the secure payment provider — LoveCry never stores card numbers.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {monthly.map((d) => (
          <li key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="font-semibold">
              {formatCadFromCents(d.amountCents)} / month · {d.campaignName}
            </p>
            <p className="mt-1 text-xs text-white/40">
              Status: {d.status} · Started {new Date(d.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-3 text-xs text-white/50">
              To change or cancel: contact{' '}
              <a href="mailto:jwilson@lovecry.ca" className="text-[#f1328b]">
                jwilson@lovecry.ca
              </a>{' '}
              or use Zeffy&apos;s donor tools once live.
            </p>
          </li>
        ))}
        {monthly.length === 0 && (
          <li className="text-white/45">
            No monthly gifts yet.{' '}
            <Link href="/donate" className="text-[#f1328b] hover:underline">
              Start one
            </Link>
          </li>
        )}
      </ul>
    </PortalShell>
  );
}
