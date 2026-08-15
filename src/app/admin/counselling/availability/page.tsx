import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { requirePermission, AuthError } from '@/lib/auth/permissions';
import { listWindows, setWindows, listOverrides, addOverride, deleteOverride, getSettings } from '@/lib/counselling/store';
import { generateSlotsForDate } from '@/lib/counselling/availability';
import { ymdInTz, addDaysYmd } from '@/lib/counselling/time-zone';
import { AdminNav } from '../page';
import type { AvailabilityWindow } from '@/lib/counselling/types';

export const metadata = { title: 'Availability | Counselling Admin' };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function minsLabel(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

export default async function AvailabilityAdminPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const windows = await listWindows();
  const overrides = await listOverrides();
  const settings = await getSettings();
  const today = ymdInTz(new Date(), settings.timeZone);
  const previewYmd = `${today.y}-${String(today.m).padStart(2, '0')}-${String(today.d).padStart(2, '0')}`;
  // Preview next weekday with openings
  let previewSlots: Awaited<ReturnType<typeof generateSlotsForDate>> = [];
  let previewDate = previewYmd;
  for (let i = 1; i < 14; i++) {
    const n = addDaysYmd(today.y, today.m, today.d, i);
    const ymd = `${n.y}-${String(n.m).padStart(2, '0')}-${String(n.d).padStart(2, '0')}`;
    const slots = await generateSlotsForDate(ymd);
    if (slots.length) {
      previewDate = ymd;
      previewSlots = slots;
      break;
    }
  }

  async function saveWindows(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const next: AvailabilityWindow[] = [];
    for (let day = 0; day < 7; day++) {
      const enabled = formData.get(`enabled-${day}`) === 'on';
      if (!enabled) continue;
      const start = Number(formData.get(`start-${day}`));
      const end = Number(formData.get(`end-${day}`));
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        next.push({
          id: `w-${day}-primary`,
          weekday: day,
          startMinutes: start,
          endMinutes: end,
          active: true,
        });
      }
      const start2 = Number(formData.get(`start2-${day}`));
      const end2 = Number(formData.get(`end2-${day}`));
      if (Number.isFinite(start2) && Number.isFinite(end2) && end2 > start2) {
        next.push({
          id: `w-${day}-secondary`,
          weekday: day,
          startMinutes: start2,
          endMinutes: end2,
          active: true,
        });
      }
    }
    await setWindows(next);
    redirect('/admin/counselling/availability');
  }

  async function addBlock(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const start = String(formData.get('start') || '');
    const end = String(formData.get('end') || '');
    const reason = String(formData.get('reason') || 'Blocked');
    if (!start || !end) return;
    await addOverride({
      id: crypto.randomUUID(),
      startTimeUtc: new Date(start).toISOString(),
      endTimeUtc: new Date(end).toISOString(),
      type: 'BLOCK',
      reason,
    });
    redirect('/admin/counselling/availability');
  }

  async function removeOverride(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    await deleteOverride(String(formData.get('id')));
    redirect('/admin/counselling/availability');
  }

  const byDay = (day: number) => windows.filter((w) => w.weekday === day);

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Availability</h1>
          <AdminNav />
        </div>
        <p className="mt-2 text-sm text-white/50">
          Weekly windows in {settings.timeZone}. Duration {settings.durationMinutes}m · buffer after{' '}
          {settings.bufferAfterMinutes}m · min notice {settings.minimumNoticeHours}h.
        </p>

        <form action={saveWindows} className="mt-8 space-y-4">
          {WEEKDAYS.map((label, day) => {
            const dayWindows = byDay(day);
            const primary = dayWindows[0];
            const secondary = dayWindows[1];
            return (
              <div key={day} className="rounded-2xl border border-white/10 p-4">
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    name={`enabled-${day}`}
                    defaultChecked={dayWindows.length > 0}
                  />
                  {label}
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-white/45">
                    Window 1 start (minutes)
                    <input
                      name={`start-${day}`}
                      type="number"
                      defaultValue={primary?.startMinutes ?? 9 * 60}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-white/45">
                    Window 1 end
                    <input
                      name={`end-${day}`}
                      type="number"
                      defaultValue={primary?.endMinutes ?? 12 * 60}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-white/45">
                    Window 2 start (optional)
                    <input
                      name={`start2-${day}`}
                      type="number"
                      defaultValue={secondary?.startMinutes ?? ''}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-white/45">
                    Window 2 end
                    <input
                      name={`end2-${day}`}
                      type="number"
                      defaultValue={secondary?.endMinutes ?? ''}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-sm text-white"
                    />
                  </label>
                </div>
                {primary && (
                  <p className="mt-2 text-xs text-white/40">
                    Current: {minsLabel(primary.startMinutes)}–{minsLabel(primary.endMinutes)}
                    {secondary
                      ? ` · ${minsLabel(secondary.startMinutes)}–${minsLabel(secondary.endMinutes)}`
                      : ''}
                  </p>
                )}
              </div>
            );
          })}
          <button
            type="submit"
            className="rounded-full bg-[#f1328b] px-5 py-2.5 text-sm font-bold"
          >
            Save weekly availability
          </button>
        </form>

        <h2 className="mt-10 text-lg font-bold">Block / vacation</h2>
        <form action={addBlock} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            name="start"
            type="datetime-local"
            required
            className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <input
            name="end"
            type="datetime-local"
            required
            className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <input
            name="reason"
            placeholder="Reason"
            className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase sm:col-span-3 sm:w-fit">
            Add block
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-white/60">
          {overrides.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
              <span>
                {o.type}: {o.startTimeUtc} → {o.endTimeUtc} {o.reason}
              </span>
              <form action={removeOverride}>
                <input type="hidden" name="id" value={o.id} />
                <button type="submit" className="text-xs text-red-300">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-lg font-bold">Client slot preview · {previewDate}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {previewSlots.map((s) => (
            <span key={s.startTimeUtc} className="rounded-full border border-white/15 px-3 py-1 text-sm">
              {s.label}
            </span>
          ))}
          {!previewSlots.length && <p className="text-white/40">No preview slots in the next two weeks.</p>}
        </div>
      </div>
    </main>
  );
}
