import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { requirePermission, AuthError } from '@/lib/auth/permissions';
import { getSettings, updateSettings, addAudit } from '@/lib/counselling/store';
import { AdminNav } from '../page';

export const metadata = { title: 'Counselling settings | LoveCry' };

export default async function CounsellingSettingsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const s = await getSettings();

  async function save(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const previous = await getSettings();
    const next = await updateSettings({
      durationMinutes: Number(formData.get('durationMinutes')) || previous.durationMinutes,
      bufferBeforeMinutes: Number(formData.get('bufferBeforeMinutes')) || 0,
      bufferAfterMinutes: Number(formData.get('bufferAfterMinutes')) || 0,
      minimumNoticeHours: Number(formData.get('minimumNoticeHours')) || previous.minimumNoticeHours,
      maximumWindowDays: Number(formData.get('maximumWindowDays')) || previous.maximumWindowDays,
      holdMinutes: Number(formData.get('holdMinutes')) || previous.holdMinutes,
      consentDeadlineHours:
        Number(formData.get('consentDeadlineHours')) || previous.consentDeadlineHours,
      consentRequiredBeforeConfirm: formData.get('consentRequiredBeforeConfirm') === 'on',
      googleMeetEnabled: formData.get('googleMeetEnabled') === 'on',
      maxAppointmentsPerDay:
        Number(formData.get('maxAppointmentsPerDay')) || previous.maxAppointmentsPerDay,
      inPersonLocation: String(formData.get('inPersonLocation') || previous.inPersonLocation),
      crisisMessage: String(formData.get('crisisMessage') || previous.crisisMessage),
    });
    await addAudit({
      appointmentId: 'settings',
      actorType: 'ADMIN',
      action: 'SETTINGS_UPDATED',
      previousData: previous,
      newData: next,
    });
    redirect('/admin/counselling/settings');
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Settings</h1>
          <AdminNav />
        </div>
        <form action={save} className="mt-8 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['durationMinutes', 'Duration (minutes)', s.durationMinutes],
              ['bufferBeforeMinutes', 'Buffer before', s.bufferBeforeMinutes],
              ['bufferAfterMinutes', 'Buffer after', s.bufferAfterMinutes],
              ['minimumNoticeHours', 'Min notice (hours)', s.minimumNoticeHours],
              ['maximumWindowDays', 'Max window (days)', s.maximumWindowDays],
              ['holdMinutes', 'Hold minutes', s.holdMinutes],
              ['consentDeadlineHours', 'Consent deadline (hours)', s.consentDeadlineHours],
              ['maxAppointmentsPerDay', 'Max per day', s.maxAppointmentsPerDay],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="text-xs uppercase tracking-wider text-white/45">
              {label}
              <input
                name={name}
                type="number"
                defaultValue={value}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm normal-case text-white"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
            <input
              type="checkbox"
              name="consentRequiredBeforeConfirm"
              defaultChecked={s.consentRequiredBeforeConfirm}
            />
            Policy A — signature required before booking confirmation
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
            <input type="checkbox" name="googleMeetEnabled" defaultChecked={s.googleMeetEnabled} />
            Google Meet enabled (when Calendar API is live)
          </label>
          <label className="text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
            In-person location
            <input
              name="inPersonLocation"
              defaultValue={s.inPersonLocation}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm normal-case text-white"
            />
          </label>
          <label className="text-xs uppercase tracking-wider text-white/45 sm:col-span-2">
            Crisis message
            <textarea
              name="crisisMessage"
              rows={3}
              defaultValue={s.crisisMessage}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm normal-case text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#f1328b] px-5 py-2.5 text-sm font-bold sm:col-span-2 sm:w-fit"
          >
            Save settings
          </button>
        </form>
      </div>
    </main>
  );
}
