import Link from 'next/link';
import { Calendar, Check, Clock, Heart, MapPin, Users } from 'lucide-react';
import type { PublicEvent } from '@/lib/events/service';
import {
  formatEventDate,
  formatEventTimeRange,
  publicLocationLabel,
  visibleImpactMetrics,
} from '@/lib/events/display';
import EventImage from '@/components/events/EventImage';

function MetricIcon({ name }: { name: string }) {
  if (name === 'attendees' || name === 'peopleReached') return <Users className="h-5 w-5" aria-hidden />;
  if (name === 'volunteers' || name === 'volunteerHours') return <Heart className="h-5 w-5" aria-hidden />;
  return <Heart className="h-5 w-5" aria-hidden />;
}

export default function PastEventRow({ event }: { event: PublicEvent }) {
  const gallery = event.media.slice(0, 4);
  const thumbs = gallery.slice(0, 2);
  const primary = event.coverImageUrl || gallery[0]?.url;
  const metrics = visibleImpactMetrics(event);
  const highlights = event.highlights.map((h) => h.text).filter(Boolean);

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0d0910] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto] lg:items-start lg:gap-6">
        <div
          className={`grid min-w-0 gap-2 ${
            thumbs.length
              ? 'grid-cols-2 sm:grid-cols-[minmax(0,1fr)_5.75rem] lg:grid-cols-[minmax(0,1fr)_6.75rem]'
              : ''
          }`}
        >
          <div
            className={`relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#18101d] ${
              thumbs.length
                ? 'col-span-2 aspect-[16/10] sm:col-auto sm:row-span-2 sm:aspect-auto sm:min-h-[11.5rem] lg:min-h-[13.75rem]'
                : 'aspect-[16/10] sm:min-h-[13.75rem]'
            }`}
          >
            <EventImage
              src={primary}
              alt={event.coverImageAlt || event.title}
              className="absolute inset-0"
              sizes="(max-width: 1024px) 100vw, 280px"
              placeholderVariant="dark"
            />
          </div>
          {thumbs.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#18101d] sm:aspect-auto sm:min-h-[5.25rem]"
            >
              <EventImage
                src={item.url}
                alt={item.altText || event.title}
                className="absolute inset-0"
                sizes="110px"
                placeholderVariant="dark"
              />
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <h3 className="font-news-headline text-xl leading-snug break-words text-white sm:text-2xl lg:text-3xl">
            <Link
              href={`/events/${event.slug}`}
              className="hover:text-[#f1328b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
            >
              {event.title}
            </Link>
          </h3>
          {event.status === 'CANCELLED' ? (
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#f1328b]">Cancelled</p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-2 text-sm text-white/60 sm:flex-row sm:flex-wrap sm:gap-x-4">
            <li className="flex min-w-0 items-start gap-1.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]/70" aria-hidden />
              <span className="min-w-0 break-words">{formatEventDate(event.startDateTime, event.timezone)}</span>
            </li>
            <li className="flex min-w-0 items-start gap-1.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]/70" aria-hidden />
              <span className="min-w-0 break-words">
                {formatEventTimeRange(event.startDateTime, event.endDateTime, event.timezone)}
              </span>
            </li>
            <li className="flex min-w-0 items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]/70" aria-hidden />
              <span className="min-w-0 break-words">{publicLocationLabel(event)}</span>
            </li>
          </ul>

          {event.impactSummary ? (
            <div className="mt-5">
              <h4 className="text-sm font-bold text-white">What happened?</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/55">{event.impactSummary}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-white/55">{event.shortDescription}</p>
          )}

          {highlights.length ? (
            <ul className="mt-4 space-y-2">
              {highlights.map((text) => (
                <li key={text} className="flex items-start gap-2 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f1328b]" aria-hidden />
                  <span className="min-w-0 break-words">{text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {metrics.length ? (
          <dl className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3 lg:w-40 lg:grid-cols-1 lg:gap-6 lg:border-t-0 lg:pt-0">
            {metrics.slice(0, 3).map((metric) => (
              <div key={metric.key} className="text-left sm:text-center lg:text-left">
                <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45 sm:justify-center lg:justify-start">
                  <span className="text-[#f1328b]/70">
                    <MetricIcon name={metric.key} />
                  </span>
                  {metric.label}
                </dt>
                <dd className="mt-1 font-news-headline text-2xl text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
