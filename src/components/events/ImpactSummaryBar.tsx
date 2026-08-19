import { Calendar, Clock, Heart, Users } from 'lucide-react';
import type { ImpactSummaryTotals } from '@/lib/events/display';

export default function ImpactSummaryBar({ totals }: { totals: ImpactSummaryTotals }) {
  const items = [
    totals.eventsHosted > 0
      ? { key: 'events', label: 'Events hosted', value: String(totals.eventsHosted), icon: Calendar }
      : null,
    totals.attendees != null
      ? { key: 'attendees', label: 'Community participants', value: String(totals.attendees), icon: Users }
      : null,
    totals.volunteers != null
      ? { key: 'volunteers', label: 'Volunteers', value: String(totals.volunteers), icon: Heart }
      : null,
    totals.volunteerHours != null
      ? { key: 'hours', label: 'Volunteer hours', value: String(totals.volunteerHours), icon: Clock }
      : null,
    totals.activities != null
      ? { key: 'activities', label: 'Activities', value: String(totals.activities), icon: Heart }
      : null,
    totals.peopleReached != null
      ? { key: 'reached', label: 'People reached', value: String(totals.peopleReached), icon: Users }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  if (!items.length) return null;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0810] px-4 py-8 sm:px-8 sm:py-10 lg:px-10"
      aria-labelledby="impact-together"
    >
      <div className="flex flex-col items-center gap-6 sm:gap-8 lg:flex-row lg:justify-between">
        <h2
          id="impact-together"
          className="flex items-center justify-center gap-3 text-center font-news-headline text-2xl text-white sm:text-3xl lg:text-left"
        >
          Our Impact Together
          <Heart className="h-5 w-5 shrink-0 text-[#f1328b] sm:h-6 sm:w-6" aria-hidden />
        </h2>
        <dl className="grid w-full grid-cols-1 gap-5 min-[400px]:grid-cols-2 sm:grid-cols-2 lg:w-auto lg:flex lg:flex-wrap lg:justify-end lg:gap-8 xl:gap-10">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`min-w-0 text-center ${index > 0 ? 'lg:border-l lg:border-white/10 lg:pl-8 xl:pl-10' : ''}`}
              >
                <dt className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase leading-tight tracking-wider text-white/50 sm:text-xs">
                  <Icon className="h-4 w-4 shrink-0 text-[#f1328b]/70" aria-hidden />
                  <span className="max-w-[9.5rem]">{item.label}</span>
                </dt>
                <dd className="mt-2 font-news-headline text-2xl text-white sm:text-3xl">{item.value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
