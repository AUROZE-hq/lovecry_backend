import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DONOR_COOKIE } from '@/lib/auth/donor-gate';
import { getDonorPreferences } from '@/lib/members/store';
import { listDonations } from '@/lib/donations/store';
import PortalShell from '@/components/portals/PortalShell';
import { logoutDonor, saveDonorPreferencesAction } from '@/app/portals/actions';

const nav = [
  { href: '/donor/donations', label: 'History' },
  { href: '/donor/monthly', label: 'Monthly giving' },
  { href: '/donor/receipts', label: 'Receipts' },
  { href: '/donor/profile', label: 'Profile' },
];

export const metadata = { title: 'Donor Profile | LoveCry' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DonorProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = (await cookies()).get(DONOR_COOKIE)?.value;
  if (!email) redirect('/donor');

  const prefs = getDonorPreferences(email);
  const latest = (await listDonations()).find(
    (d) => d.email?.toLowerCase() === email.toLowerCase()
  );
  const params = await searchParams;
  const saved = params.saved === '1';

  return (
    <PortalShell
      title="Profile & preferences"
      subtitle="Donor Portal"
      email={email}
      nav={nav}
      logoutAction={logoutDonor}
    >
      {saved && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Preferences saved.
        </p>
      )}

      <form action={saveDonorPreferencesAction} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/60">
            First name
            <input
              name="firstName"
              defaultValue={prefs?.firstName || latest?.firstName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
          <label className="block text-sm text-white/60">
            Last name
            <input
              name="lastName"
              defaultValue={prefs?.lastName || latest?.lastName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
        </div>
        <label className="block text-sm text-white/60">
          Phone
          <input
            name="phone"
            defaultValue={prefs?.phone || ''}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            name="marketingConsent"
            defaultChecked={prefs?.marketingConsent || latest?.marketingConsent}
            className="mt-1"
          />
          Send me LoveCry updates (optional)
        </label>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-sm font-bold text-white"
        >
          Save preferences
        </button>
      </form>
    </PortalShell>
  );
}
