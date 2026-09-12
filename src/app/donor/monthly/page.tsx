import { redirect } from 'next/navigation';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { getDonorPortalSummary } from '@/lib/donations/service';
import { formatCadFromCents } from '@/lib/donations/campaigns';
import PortalShell, { DONOR_PORTAL_NAV } from '@/components/portals/PortalShell';
import { logoutDonor } from '@/app/portals/actions';
import CancelMonthlyButton from '@/components/donor/CancelMonthlyButton';

export const metadata = { title: 'Monthly Giving | LoveCry Donor Portal' };

export default async function DonorMonthlyPage() {
  const donor = await getAuthenticatedDonor();
  if (!donor) redirect('/donor');
  const summary = await getDonorPortalSummary(donor.id);
  const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Donor';
  const active = summary.recurring.filter((r) => r.status === 'ACTIVE');

  return (
    <PortalShell
      title="Monthly Giving"
      subtitle="Manage your recurring LoveCry gifts."
      email={donor.email}
      displayName={name}
      nav={DONOR_PORTAL_NAV}
      activeHref="/donor/monthly"
      logoutAction={logoutDonor}
    >
      {active.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">
          You have no active monthly gifts.{' '}
          <a href="/donate" className="font-semibold text-[#f1328b] hover:underline">
            Start a monthly gift
          </a>
        </div>
      ) : (
        <ul className="space-y-4">
          {active.map((r) => (
            <li key={r.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-2xl font-black text-white">
                {formatCadFromCents(r.amountCents)}
                <span className="text-base font-semibold text-white/50"> / month</span>
              </p>
              <p className="mt-2 text-sm text-white/60">
                {r.campaign?.name || 'Where Needed Most'}
              </p>
              <p className="mt-1 text-sm text-white/45">
                Next gift:{' '}
                {r.nextExpectedPaymentAt
                  ? new Date(r.nextExpectedPaymentAt).toLocaleDateString('en-CA', {
                      dateStyle: 'medium',
                    })
                  : '—'}
              </p>
              <p className="mt-1 text-sm text-white/45">
                Payment method: {r.paymentMethodMasked || 'Card via Zeffy'}
              </p>
              <div className="mt-5">
                <CancelMonthlyButton
                  recurringId={r.id}
                  amountLabel={formatCadFromCents(r.amountCents)}
                  campaignName={r.campaign?.name || 'Where Needed Most'}
                  nextDate={
                    r.nextExpectedPaymentAt
                      ? new Date(r.nextExpectedPaymentAt).toLocaleDateString('en-CA', {
                          dateStyle: 'medium',
                        })
                      : '—'
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
