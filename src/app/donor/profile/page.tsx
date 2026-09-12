import { redirect } from 'next/navigation';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { prisma } from '@/lib/db/prisma';
import PortalShell, { DONOR_PORTAL_NAV } from '@/components/portals/PortalShell';
import { logoutDonor, saveDonorPreferencesAction } from '@/app/portals/actions';

export const metadata = { title: 'Donor Profile | LoveCry' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DonorProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const donor = await getAuthenticatedDonor();
  if (!donor) redirect('/donor');

  const row = await prisma.donor.findUnique({ where: { id: donor.id } });
  if (!row) redirect('/donor');

  const params = await searchParams;
  const saved = params.saved === '1';
  const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Donor';

  return (
    <PortalShell
      title="Profile"
      subtitle="Update your contact preferences."
      email={donor.email}
      displayName={name}
      nav={DONOR_PORTAL_NAV}
      activeHref="/donor/profile"
      logoutAction={logoutDonor}
    >
      {saved && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Preferences saved.
        </p>
      )}

      <form
        action={saveDonorPreferencesAction}
        className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/60">
            First name
            <input
              name="firstName"
              defaultValue={row.firstName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
          <label className="block text-sm text-white/60">
            Last name
            <input
              name="lastName"
              defaultValue={row.lastName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
        </div>
        <label className="block text-sm text-white/60">
          Phone
          <input
            name="phone"
            defaultValue={row.phone || ''}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            name="marketingConsent"
            defaultChecked={row.marketingConsent}
            className="mt-1"
          />
          Send me LoveCry updates (optional)
        </label>
        <button
          type="submit"
          className="rounded-full bg-[#f1328b] px-6 py-3 text-sm font-bold text-white"
        >
          Save preferences
        </button>
      </form>
    </PortalShell>
  );
}
