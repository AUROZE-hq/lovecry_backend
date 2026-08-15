import { orgInfo } from '@/lib/org-info';
import type { PublicEvent } from '@/lib/events/service';

export default function EventJsonLd({ event }: { event: PublicEvent }) {
  const attendanceMode =
    event.locationType === 'ONLINE'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.locationType === 'HYBRID'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode';

  const location =
    event.locationType === 'ONLINE'
      ? {
          '@type': 'VirtualLocation',
          name: event.onlinePlatform || 'Online Event',
        }
      : {
          '@type': 'Place',
          name: event.venueName || orgInfo.shortName,
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.addressLine || undefined,
            addressLocality: event.city || undefined,
            addressRegion: event.province || undefined,
            postalCode: event.postalCode || undefined,
            addressCountry: 'CA',
          },
        };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.shortDescription,
    startDate: event.startDateTime.toISOString(),
    endDate: event.endDateTime?.toISOString(),
    eventStatus:
      event.status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: attendanceMode,
    location,
    image: event.coverImageUrl || undefined,
    organizer: {
      '@type': 'NGO',
      name: orgInfo.legalName,
      url: orgInfo.websiteHref,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
