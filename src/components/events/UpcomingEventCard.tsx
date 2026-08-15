import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { PublicEvent } from '@/lib/events/service';
import {
  ctaForEvent,
  formatDateBadge,
  formatEventDate,
  formatEventTimeRange,
  publicLocationLabel,
} from '@/lib/events/display';
import EventImage from '@/components/events/EventImage';

const ctaClassName =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#693492] px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4B2A63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#693492] sm:w-auto';

export default function UpcomingEventCard({ event }: { event: PublicEvent }) {
  const badge = formatDateBadge(event.startDateTime, event.timezone);
  const cta = ctaForEvent(event);
  const cancelled = event.status === 'CANCELLED';

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[#E8DFEF] bg-white shadow-[0_12px_40px_rgba(75,42,99,0.06)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#EDE4F5]">
        <EventImage
          src={event.coverImageUrl}
          alt={event.coverImageAlt || event.title}
          className="absolute inset-0"
        />
        <div
          className="absolute left-3 top-3 rounded-xl bg-white px-2.5 py-1.5 text-center shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-2"
          aria-hidden="true"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#693492]">{badge.month}</p>
          <p className="font-news-headline text-xl leading-none text-[#2A1A38] sm:text-2xl">{badge.day}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#A084B7]">{badge.weekday}</p>
        </div>
        {cancelled ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#693492] sm:right-4 sm:top-4">
            Cancelled
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <h3 className="font-news-headline text-xl leading-snug break-words text-[#2A1A38] sm:text-2xl">
          <Link
            href={`/events/${event.slug}`}
            className="hover:text-[#693492] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#693492]"
          >
            {event.title}
          </Link>
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-[#5C4A6B]">
          <li className="flex min-w-0 items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">{formatEventDate(event.startDateTime, event.timezone)}</span>
          </li>
          <li className="flex min-w-0 items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">
              {formatEventTimeRange(event.startDateTime, event.endDateTime, event.timezone)}
            </span>
          </li>
          <li className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">{publicLocationLabel(event)}</span>
          </li>
        </ul>
        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-[#6B5A78]">{event.shortDescription}</p>
        <div className="mt-6 flex justify-center">
          {cta.external ? (
            <a href={cta.href} target="_blank" rel="noopener noreferrer" className={ctaClassName}>
              {cta.label}
            </a>
          ) : (
            <Link href={cta.href} className={ctaClassName}>
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
