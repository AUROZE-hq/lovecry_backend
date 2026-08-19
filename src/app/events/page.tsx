import type { Metadata } from 'next';
import { ArrowRight, Calendar, Heart } from 'lucide-react';
import {
  getPublicImpactSummary,
  getPublishedPastEvents,
  getPublishedUpcomingEvents,
} from '@/lib/events/service';
import EventsTabs from '@/components/events/EventsTabs';
import UpcomingEventCard from '@/components/events/UpcomingEventCard';
import PastEventRow from '@/components/events/PastEventRow';
import ImpactSummaryBar from '@/components/events/ImpactSummaryBar';
import BePartOfTheChange from '@/components/events/BePartOfTheChange';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events | LoveCry',
  description:
    'Explore upcoming LoveCry gatherings and look back at community events. Dates, locations, and impact details are published by LoveCry administrators.',
};

export default async function EventsPage() {
  const [upcoming, past, impact] = await Promise.all([
    getPublishedUpcomingEvents(),
    getPublishedPastEvents(),
    getPublicImpactSummary(),
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] pt-20 text-white">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#693492]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#f1328b]/8 blur-[120px]" />
      </div>

      <section className="relative z-10 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b] sm:text-xs">Events</p>
              <h1 className="mt-3 font-news-headline text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">Events</h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Explore upcoming gatherings and look back at the moments we&apos;ve shared with our community.
              </p>
            </div>
            <p className="brand-script text-left text-xl leading-snug text-[#c084fc] sm:text-2xl lg:text-right lg:text-3xl">
              Healing happens together.
              <br />
              Community creates change.
              <span className="mt-2 block text-base text-[#f1328b] sm:text-lg" aria-hidden>
                ♡
              </span>
            </p>
          </div>
          <EventsTabs />
        </div>
      </section>

      <section id="upcoming" className="relative z-10 scroll-mt-24 px-4 py-8 sm:scroll-mt-28 sm:px-6 sm:py-10 lg:px-10" aria-labelledby="upcoming-heading">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <h2 id="upcoming-heading" className="flex items-center gap-2 font-news-headline text-2xl text-white sm:text-3xl">
              <Calendar className="h-5 w-5 shrink-0 text-[#f1328b] sm:h-6 sm:w-6" aria-hidden />
              Upcoming Events
            </h2>
            {upcoming.length > 3 ? (
              <a href="#upcoming" className="text-sm font-semibold text-[#f1328b] hover:text-[#ff4da6] hover:underline">
                View all upcoming events <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
          {upcoming.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {upcoming.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60 sm:px-6 sm:py-12 sm:text-base">
              Upcoming events will be announced soon.
              <span className="mt-2 block text-white/45">Check back for new LoveCry community gatherings and programs.</span>
            </p>
          )}
        </div>
      </section>

      <section id="past" className="relative z-10 scroll-mt-24 px-4 py-8 sm:scroll-mt-28 sm:px-6 sm:py-10 lg:px-10" aria-labelledby="past-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="past-heading" className="mb-6 flex items-start gap-2 font-news-headline text-2xl text-white sm:mb-8 sm:items-center sm:text-3xl">
            <Heart className="mt-1 h-5 w-5 shrink-0 text-[#f1328b] sm:mt-0 sm:h-6 sm:w-6" aria-hidden />
            Past Events & Community Impact
          </h2>
          {past.length ? (
            <div className="space-y-5 sm:space-y-8">
              {past.map((event) => (
                <PastEventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60 sm:px-6 sm:py-12 sm:text-base">
              Past event stories will appear here after LoveCry publishes verified gatherings.
            </p>
          )}
        </div>
      </section>

      <div className="relative z-10 px-4 py-6 pb-16 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
          <ImpactSummaryBar totals={impact} />
          <BePartOfTheChange />
        </div>
      </div>
    </div>
  );
}
