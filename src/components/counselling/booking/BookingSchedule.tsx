'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildCalendarGrid,
  counsellorInitials,
  formatClockTime,
  formatCompactClockTime,
  formatCredentialLine,
  formatMonthYear,
  formatServiceLabel,
  formatYmdLong,
} from '@/lib/counselling/display';
import { orgInfo } from '@/lib/org-info';
import type { BookingBootstrap, BookingService, TimeSlot } from './types';

const WEEKDAYS_DESKTOP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAYS_MOBILE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

type Props = {
  boot: BookingBootstrap;
  service: BookingService | null;
  dates: string[];
  datesLoading: boolean;
  viewYear: number;
  viewMonth: number;
  onViewMonthChange: (year: number, month: number) => void;
  selectedDate: string;
  onSelectDate: (ymd: string) => void;
  slots: TimeSlot[];
  slotsLoading: boolean;
  holding: boolean;
  holdingStart: string | null;
  error: string | null;
  onSelectSlot: (slot: TimeSlot) => void;
};

export default function BookingSchedule({
  boot,
  service,
  dates,
  datesLoading,
  viewYear,
  viewMonth,
  onViewMonthChange,
  selectedDate,
  onSelectDate,
  slots,
  slotsLoading,
  holding,
  holdingStart,
  error,
  onSelectSlot,
}: Props) {
  const available = new Set(dates);
  const cells = buildCalendarGrid(viewYear, viewMonth, available);
  const duration = service?.durationMinutes || boot.settings.durationMinutes;
  const serviceLabel = formatServiceLabel(service?.name || 'Individual counselling');
  const counsellor = boot.counsellor.displayName;
  const credentials = formatCredentialLine(orgInfo.ceoCredentials);
  const initials = counsellorInitials(counsellor);

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
    onViewMonthChange(date.getUTCFullYear(), date.getUTCMonth() + 1);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="site-header-gradient relative overflow-hidden px-4 pb-10 pt-[calc(var(--site-header-height)+1.75rem)] sm:pb-14 sm:pt-[calc(var(--site-header-height)+2.5rem)] lg:px-6">
        <div className="relative mx-auto max-w-6xl">
          <div className="lg:text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/90 lg:tracking-[0.35em]">
              <span className="lg:hidden">Book a counselling session</span>
              <span className="hidden lg:inline">{orgInfo.shortName} counselling</span>
            </p>
            <h1 className="font-hero mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="lg:hidden">Choose a time.</span>
              <span className="hidden lg:inline">Book a time that works for you.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg lg:mx-auto">
              <span className="lg:hidden">
                {counsellor} · {duration} minutes
              </span>
              <span className="hidden lg:inline">
                Private {duration}-minute counselling with {counsellor}.
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-6 sm:pt-8 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#f1328b] text-sm font-bold tracking-wide text-white"
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <p className="font-semibold text-white">{counsellor}</p>
                <p className="mt-0.5 text-sm text-white/50">
                  <span className="hidden sm:inline">{credentials}</span>
                  <span className="sm:hidden">
                    {credentials
                      .split(' · ')
                      .filter((part) => part !== 'Registered Social Worker')
                      .join(' · ')}
                  </span>
                </p>
              </div>
            </div>
            <div className="hidden text-right lg:block">
              <p className="font-medium text-white">{duration} minutes</p>
              <p className="mt-0.5 text-sm text-white/50">{serviceLabel}</p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              {error}
            </p>
          )}

          <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0a12]">
            {datesLoading ? (
              <ScheduleSkeleton />
            ) : dates.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-hero text-xl font-bold">No appointments are available right now.</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
                  Please check back soon, or contact LoveCry if you need help booking a counselling
                  session.
                </p>
              </div>
            ) : (
              <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="font-hero text-xl font-bold sm:text-2xl">
                      {formatMonthYear(viewYear, viewMonth)}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => shiftMonth(-1)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:text-white ${FOCUS}`}
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftMonth(1)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:text-white ${FOCUS}`}
                        aria-label="Next month"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div role="grid" aria-label={`${formatMonthYear(viewYear, viewMonth)} calendar`}>
                    <div className="mb-2 grid grid-cols-7" role="row">
                      {WEEKDAYS_DESKTOP.map((day, i) => (
                        <div
                          key={day}
                          role="columnheader"
                          className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 sm:text-[11px]"
                        >
                          <span className="lg:hidden">{WEEKDAYS_MOBILE[i]}</span>
                          <span className="hidden lg:inline">{day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((cell) => {
                        const selected = cell.ymd === selectedDate;
                        const selectable = cell.inMonth && cell.available;
                        return (
                          <button
                            key={cell.ymd}
                            type="button"
                            role="gridcell"
                            aria-selected={selected}
                            aria-current={selected ? 'date' : undefined}
                            aria-label={formatYmdLong(cell.ymd)}
                            disabled={!selectable || holding}
                            onClick={() => onSelectDate(cell.ymd)}
                            className={`aspect-square rounded-xl text-sm font-medium transition ${FOCUS} ${
                              selected
                                ? 'bg-[#f1328b] text-white'
                                : selectable
                                  ? 'text-white hover:bg-white/10'
                                  : cell.inMonth
                                    ? 'cursor-default text-white/25'
                                    : 'cursor-default text-white/15'
                            } disabled:pointer-events-none`}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                  <h3 className="font-hero text-xl font-bold lg:text-2xl">
                    <span className="lg:hidden">
                      {selectedDate ? `${formatYmdLong(selectedDate)} · Available times` : 'Available times'}
                    </span>
                    <span className="hidden lg:inline">
                      {selectedDate ? formatYmdLong(selectedDate) : 'Select a date'}
                    </span>
                  </h3>
                  <p className="mt-1 hidden text-sm text-white/45 lg:block">Available times</p>

                  <div
                    className="mt-5 grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-3"
                    aria-busy={slotsLoading || holding}
                    aria-live="polite"
                  >
                    {slotsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 animate-pulse rounded-xl bg-white/5 lg:h-12"
                        />
                      ))
                    ) : slots.length === 0 ? (
                      <p className="col-span-4 rounded-xl border border-white/10 px-4 py-6 text-sm text-white/50 lg:col-span-1">
                        No times available on this date.
                      </p>
                    ) : (
                      slots.map((slot) => {
                        const active = holdingStart === slot.startTimeUtc;
                        return (
                          <button
                            key={slot.startTimeUtc}
                            type="button"
                            disabled={holding}
                            onClick={() => onSelectSlot(slot)}
                            aria-label={formatClockTime(slot.startTimeUtc, boot.settings.timeZone)}
                            className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3.5 lg:text-base ${FOCUS} ${
                              active
                                ? 'border-[#f1328b] bg-[#f1328b] text-white'
                                : 'border-white/10 bg-transparent text-white hover:border-white/25 hover:bg-white/5'
                            } disabled:opacity-60`}
                          >
                            <span className="lg:hidden">
                              {holding && active
                                ? 'Holding…'
                                : formatCompactClockTime(slot.startTimeUtc, boot.settings.timeZone)}
                            </span>
                            <span className="hidden lg:inline">
                              {holding && active
                                ? 'Holding…'
                                : formatClockTime(slot.startTimeUtc, boot.settings.timeZone)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 hidden gap-4 lg:grid lg:grid-cols-3">
            {[
              { title: 'Free counselling', text: 'Accessible support at no cost.' },
              { title: 'Flexible format', text: 'In person, video, or phone.' },
              { title: 'Private & confidential', text: 'Your information stays protected.' },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[16px] border border-white/[0.08] bg-[#0c0a12] px-5 py-4"
              >
                <p className="font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-sm text-white/45">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-white/10" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 p-6 lg:border-l lg:border-t-0 lg:p-8">
        <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
