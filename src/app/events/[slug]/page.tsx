import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { getEventBySlug } from '@/lib/events/service';
import {
  ctaForEvent,
  formatEventDate,
  formatEventTimeRange,
  publicLocationLabel,
  registrationAvailability,
  visibleImpactMetrics,
} from '@/lib/events/display';
import EventImage from '@/components/events/EventImage';
import EventJsonLd from '@/components/events/EventJsonLd';
import RegisterEventForm from '@/components/events/RegisterEventForm';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const preview = query.preview === '1' && (await isAdminUnlocked());
  const event = await getEventBySlug(slug, { allowPreview: preview });
  if (!event) return { title: 'Event | LoveCry' };
  return {
    title: `${event.title} | LoveCry Events`,
    description: event.shortDescription,
    openGraph: {
      title: event.title,
      description: event.shortDescription,
      images: event.coverImageUrl ? [{ url: event.coverImageUrl }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const preview = query.preview === '1' && (await isAdminUnlocked());
  const event = await getEventBySlug(slug, { allowPreview: preview });
  if (!event) notFound();

  const cta = ctaForEvent(event);
  const metrics = visibleImpactMetrics(event);
  const availability = registrationAvailability({
    status: event.status,
    registrationType: event.registrationType,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    registeredCount: event._count.registrations,
  });
  const closedReason =
    event.registrationType !== 'INTERNAL_REGISTRATION'
      ? null
      : !availability.open
        ? availability.reason === 'cancelled'
          ? 'This event has been cancelled. Registration is closed.'
          : availability.reason === 'deadline'
            ? 'Registration for this event has closed.'
            : availability.reason === 'capacity'
              ? 'This event is at capacity.'
              : 'Registration is not open for this event.'
        : null;

  const registered = query.registered === '1';
  const emailed = query.emailed === '1';
  const error = typeof query.error === 'string' ? query.error : null;
  // eslint-disable-next-line react-hooks/purity -- server component snapshot of "now"
  const isPast = (event.endDateTime ?? event.startDateTime).getTime() < Date.now();

  return (
    <div className="min-h-screen bg-[#FBF8FC] text-[#2A1A38]">
      <EventJsonLd event={event} />
      <article className="mx-auto max-w-4xl overflow-x-hidden px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-10">
        <Link href="/events" className="text-sm font-semibold text-[#693492] hover:underline">
          ← All events
        </Link>
        <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-3xl bg-[#EDE4F5] sm:aspect-[16/8]">
          <EventImage
            src={event.coverImageUrl}
            alt={event.coverImageAlt || event.title}
            className="absolute inset-0"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
        {event.status === 'CANCELLED' ? (
          <p className="mt-4 inline-flex rounded-full bg-[#F3ECF7] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#693492]">
            Cancelled
          </p>
        ) : preview && event.status !== 'PUBLISHED' ? (
          <p className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            Preview · {event.status}
          </p>
        ) : null}
        {event.eventCategory ? (
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#693492]">{event.eventCategory}</p>
        ) : null}
        <h1 className="mt-3 font-news-headline text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">{event.title}</h1>
        <ul className="mt-6 space-y-2 text-sm text-[#5C4A6B]">
          <li className="flex min-w-0 items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">{formatEventDate(event.startDateTime, event.timezone)}</span>
          </li>
          <li className="flex min-w-0 items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">
              {formatEventTimeRange(event.startDateTime, event.endDateTime, event.timezone)}
              <span className="text-[#8A7798]"> ({event.timezone})</span>
            </span>
          </li>
          <li className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A084B7]" aria-hidden />
            <span className="min-w-0 break-words">{publicLocationLabel(event)}</span>
          </li>
        </ul>
        {event.addressLine || event.city ? (
          <p className="mt-2 text-sm text-[#6B5A78]">
            {[event.venueName, event.addressLine, event.city, event.province, event.postalCode]
              .filter(Boolean)
              .join(', ')}
          </p>
        ) : null}

        <p className="mt-8 text-lg leading-relaxed text-[#5C4A6B]">{event.shortDescription}</p>
        {event.description ? (
          <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-[#6B5A78]">{event.description}</div>
        ) : null}

        {event.capacity != null ? (
          <p className="mt-6 text-sm text-[#6B5A78]">Capacity: {event.capacity}</p>
        ) : null}
        {event.registrationDeadline ? (
          <p className="mt-2 text-sm text-[#6B5A78]">
            Registration deadline:{' '}
            {formatEventDate(event.registrationDeadline, event.timezone)}{' '}
            {formatEventTimeRange(event.registrationDeadline, null, event.timezone)}
          </p>
        ) : null}

        {event.registrationType === 'EXTERNAL_REGISTRATION' && event.registrationUrl && event.status === 'PUBLISHED' ? (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#693492] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#4B2A63] sm:w-auto"
          >
            {cta.label}
          </a>
        ) : null}

        {event.registrationType !== 'INTERNAL_REGISTRATION' && event.registrationType !== 'EXTERNAL_REGISTRATION' ? (
          <p className="mt-8 text-sm text-[#6B5A78]">No online registration is required for this event.</p>
        ) : null}

        {isPast && (event.impactSummary || event.highlights.length || metrics.length) ? (
          <section className="mt-12 border-t border-[#E8DFEF] pt-8" aria-labelledby="what-happened">
            <h2 id="what-happened" className="font-news-headline text-3xl">
              What happened
            </h2>
            {event.impactSummary ? (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-[#5C4A6B]">{event.impactSummary}</p>
            ) : null}
            {event.highlights.length ? (
              <ul className="mt-6 list-disc space-y-2 pl-5 text-[#4B2A63]">
                {event.highlights.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            ) : null}
            {metrics.length ? (
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.key} className="rounded-2xl bg-white p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#A084B7]">{metric.label}</dt>
                    <dd className="mt-1 font-news-headline text-2xl">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}

        {event.media.length ? (
          <section className="mt-12" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="font-news-headline text-3xl">
              Gallery
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.media.map((item) => (
                <li key={item.id} className="relative aspect-square overflow-hidden rounded-2xl bg-[#EDE4F5]">
                  <EventImage src={item.url} alt={item.altText || event.title} className="absolute inset-0" sizes="200px" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {event.registrationType === 'INTERNAL_REGISTRATION' ? (
          <section id="register" className="mt-12 scroll-mt-28" aria-labelledby="register-heading">
            <h2 id="register-heading" className="font-news-headline text-3xl">
              Register
            </h2>
            {registered ? (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
                Registration confirmed.
                {emailed ? ' A confirmation was sent to your email.' : ''}
              </p>
            ) : (
              <div className="mt-4">
                {error ? (
                  <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {error}
                  </p>
                ) : null}
                <RegisterEventForm eventId={event.id} slug={event.slug} closedReason={closedReason} />
              </div>
            )}
          </section>
        ) : null}
      </article>
    </div>
  );
}
