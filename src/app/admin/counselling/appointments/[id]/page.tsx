import { redirect, notFound } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { requirePermission, AuthError } from '@/lib/auth/permissions';
import {
  getAppointment,
  getSignedConsent,
  listAudits,
  upsertAppointment,
  addAudit,
} from '@/lib/counselling/store';
import { cancelBooking } from '@/lib/counselling/service';
import { formatInTz } from '@/lib/counselling/time-zone';
import { deliverCounsellingEmail } from '@/lib/counselling/email';
import { AdminNav } from '../../page';

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminAppointmentDetailPage({ params }: Ctx) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const { id } = await params;
  const appt = await getAppointment(id);
  if (!appt) notFound();
  const signed = await getSignedConsent(id);
  const audits = await listAudits(30, id);

  async function markCompleted() {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const a = await getAppointment(id);
    if (!a) return;
    a.status = 'COMPLETED';
    a.completedAt = new Date().toISOString();
    a.updatedAt = a.completedAt;
    await upsertAppointment(a);
    await addAudit({ appointmentId: id, actorType: 'ADMIN', action: 'MARKED_COMPLETED' });
    redirect(`/admin/counselling/appointments/${id}`);
  }

  async function markNoShow() {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const a = await getAppointment(id);
    if (!a) return;
    a.status = 'NO_SHOW';
    a.noShowAt = new Date().toISOString();
    a.updatedAt = a.noShowAt;
    await upsertAppointment(a);
    await addAudit({ appointmentId: id, actorType: 'ADMIN', action: 'MARKED_NO_SHOW' });
    redirect(`/admin/counselling/appointments/${id}`);
  }

  async function cancelAction(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const reason = String(formData.get('reason') || '');
    await cancelBooking(id, reason || undefined, 'ADMIN');
    redirect(`/admin/counselling/appointments/${id}`);
  }

  async function resendConfirmation() {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const a = await getAppointment(id);
    if (!a) return;
    await deliverCounsellingEmail({ kind: 'booking_confirmation', appointment: a });
    await addAudit({ appointmentId: id, actorType: 'ADMIN', action: 'RESEND_CONFIRMATION' });
    redirect(`/admin/counselling/appointments/${id}`);
  }

  async function sendConsentReminder() {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const a = await getAppointment(id);
    if (!a || a.consentStatus === 'SIGNED') return;
    await deliverCounsellingEmail({ kind: 'consent_required', appointment: a });
    await addAudit({ appointmentId: id, actorType: 'ADMIN', action: 'SEND_CONSENT_REMINDER' });
    redirect(`/admin/counselling/appointments/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">{appt.referenceNumber}</h1>
          <AdminNav />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 p-5 text-sm">
            <h2 className="font-bold">Appointment</h2>
            <ul className="mt-3 space-y-2 text-white/70">
              <li>
                {formatInTz(appt.startTimeUtc, { dateStyle: 'full', timeStyle: 'short' })} (
                {appt.timeZone})
              </li>
              <li>Status: {appt.status}</li>
              <li>Mode: {appt.appointmentMode}</li>
              <li>Consent: {appt.consentStatus}</li>
              <li>Calendar event: {appt.googleCalendarEventId || '—'}</li>
              <li>Meet: {appt.googleMeetUrl || '—'}</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 p-5 text-sm">
            <h2 className="font-bold">Client</h2>
            <ul className="mt-3 space-y-2 text-white/70">
              <li>
                {appt.client.firstName} {appt.client.lastName}
              </li>
              <li>{appt.client.email}</li>
              <li>{appt.client.phone}</li>
              <li>
                Safe voicemail: {String(appt.client.safeToLeaveVoicemail)} · Safe email:{' '}
                {String(appt.client.safeToSendEmail)}
              </li>
              {appt.client.emergencyContactName && (
                <li>
                  Emergency: {appt.client.emergencyContactName} ({appt.client.emergencyContactPhone})
                </li>
              )}
            </ul>
          </section>
        </div>

        {signed && (
          <section className="mt-6 rounded-2xl border border-white/10 p-5 text-sm">
            <h2 className="font-bold">Signed consent</h2>
            <p className="mt-2 text-white/70">
              {signed.clientLegalName} · {signed.signedAtUtc} · hash {signed.finalDocumentHash.slice(0, 12)}…
            </p>
            <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/55">
              {signed.certificateText}
            </pre>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-3">
          <form action={markCompleted}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase">
              Mark completed
            </button>
          </form>
          <form action={markNoShow}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase">
              Mark no-show
            </button>
          </form>
          <form action={resendConfirmation}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase">
              Resend confirmation
            </button>
          </form>
          <form action={sendConsentReminder}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase">
              Consent reminder
            </button>
          </form>
        </section>

        <form action={cancelAction} className="mt-6 rounded-2xl border border-red-400/30 p-4">
          <label className="block text-sm">
            Cancel reason
            <input
              name="reason"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="mt-3 rounded-full border border-red-400/50 px-4 py-2 text-xs font-bold uppercase text-red-200"
          >
            Cancel appointment
          </button>
        </form>

        <h2 className="mt-10 font-bold">Audit</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/55">
          {audits.map((a) => (
            <li key={a.id}>
              {a.createdAt} · {a.action} · {a.actorType}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
