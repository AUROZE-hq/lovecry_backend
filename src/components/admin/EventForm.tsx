'use client';

import { useMemo, useRef, useState } from 'react';
import type { EventWithRelations } from '@/lib/events/service';
import { utcToLocalDateTimeParts } from '@/lib/events/display';
import { slugifyTitle } from '@/lib/events/slug';
import {
  createEventAction,
  updateEventAction,
} from '@/app/admin/events/actions';

const fieldClass =
  'mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm normal-case text-white';
const labelClass = 'text-xs uppercase tracking-wider text-white/45';

type GalleryItem = { id: string; url: string; altText: string };

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

async function uploadEventImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/admin/events/upload', {
    method: 'POST',
    body,
  });
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: string; image?: { url?: string } }
    | null;
  if (!response.ok || !payload?.success || !payload.image?.url) {
    throw new Error(payload?.error || 'Unable to upload image.');
  }
  return payload.image.url;
}

type EventFormProps = {
  mode: 'create' | 'edit';
  event?: EventWithRelations;
  canWrite: boolean;
};

function eventToDefaults(event?: EventWithRelations) {
  const tz = event?.timezone || 'America/Toronto';
  const start = event ? utcToLocalDateTimeParts(event.startDateTime, tz) : { date: '', time: '' };
  const end = event?.endDateTime ? utcToLocalDateTimeParts(event.endDateTime, tz) : { date: '', time: '' };
  const deadline = event?.registrationDeadline
    ? utcToLocalDateTimeParts(event.registrationDeadline, tz)
    : { date: '', time: '' };

  return {
    title: event?.title ?? '',
    slug: event?.slug ?? '',
    shortDescription: event?.shortDescription ?? '',
    description: event?.description ?? '',
    eventCategory: event?.eventCategory ?? '',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    timezone: tz,
    locationType: event?.locationType ?? 'IN_PERSON',
    venueName: event?.venueName ?? '',
    addressLine: event?.addressLine ?? '',
    city: event?.city ?? '',
    province: event?.province ?? '',
    postalCode: event?.postalCode ?? '',
    onlinePlatform: event?.onlinePlatform ?? '',
    onlineUrl: event?.onlineUrl ?? '',
    coverImageUrl: event?.coverImageUrl ?? '',
    coverImageAlt: event?.coverImageAlt ?? '',
    registrationType: event?.registrationType ?? 'LEARN_MORE',
    registrationUrl: event?.registrationUrl ?? '',
    registrationDeadlineDate: deadline.date,
    registrationDeadlineTime: deadline.time,
    capacity: event?.capacity != null ? String(event.capacity) : '',
    ctaLabel: event?.ctaLabel ?? '',
    impactSummary: event?.impactSummary ?? '',
    attendeesCount: event?.attendeesCount != null ? String(event.attendeesCount) : '',
    volunteersCount: event?.volunteersCount != null ? String(event.volunteersCount) : '',
    volunteerHours: event?.volunteerHours != null ? String(event.volunteerHours) : '',
    activitiesCount: event?.activitiesCount != null ? String(event.activitiesCount) : '',
    peopleReached: event?.peopleReached != null ? String(event.peopleReached) : '',
    highlights: event?.highlights.map((h) => h.text) ?? [''],
    gallery: (event?.media.map((m) => ({
      id: m.id,
      url: m.url,
      altText: m.altText ?? '',
    })) ?? []) as GalleryItem[],
  };
}

export default function EventForm({ mode, event, canWrite }: EventFormProps) {
  const defaults = useMemo(() => eventToDefaults(event), [event]);
  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [locationType, setLocationType] = useState(defaults.locationType);
  const [registrationType, setRegistrationType] = useState(defaults.registrationType);
  const [highlights, setHighlights] = useState(defaults.highlights.length ? defaults.highlights : ['']);
  const [gallery, setGallery] = useState<GalleryItem[]>(defaults.gallery);
  const [coverImageUrl, setCoverImageUrl] = useState(defaults.coverImageUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadPending = coverUploading || galleryUploading;

  const action = mode === 'create' ? createEventAction : updateEventAction;
  const showVenue = locationType === 'IN_PERSON' || locationType === 'HYBRID';
  const showOnline = locationType === 'ONLINE' || locationType === 'HYBRID';

  async function handleCoverSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setCoverError(null);
    setCoverUploading(true);
    try {
      const url = await uploadEventImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  async function handleGallerySelected(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    setGalleryError(null);
    setGalleryUploading(true);
    const failures: string[] = [];
    try {
      for (const file of selected) {
        try {
          const url = await uploadEventImage(file);
          setGallery((rows) => [...rows, { id: `${url}-${crypto.randomUUID()}`, url, altText: '' }]);
        } catch (err) {
          failures.push(`${file.name}: ${err instanceof Error ? err.message : 'Unable to upload image.'}`);
        }
      }
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
    if (failures.length) setGalleryError(failures.join(' '));
  }

  return (
    <form action={action} className="mt-8 space-y-10">
      {mode === 'edit' && event ? <input type="hidden" name="eventId" value={event.id} /> : null}
      <input type="hidden" name="highlightsJson" value={JSON.stringify(highlights.filter((h) => h.trim()).map((text) => ({ text })))} />
      <input
        type="hidden"
        name="galleryJson"
        value={JSON.stringify(gallery.filter((item) => item.url.trim()).map((item) => ({ url: item.url.trim(), altText: item.altText.trim() || null })))}
      />

      <fieldset disabled={!canWrite} className="space-y-4">
        <legend className="text-lg font-bold text-white">Basic information</legend>
        <label className={labelClass}>
          Event title *
          <input
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugifyTitle(e.target.value));
            }}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Slug *
          <input
            name="slug"
            required
            maxLength={80}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Category
          <input name="eventCategory" defaultValue={defaults.eventCategory} maxLength={80} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Short description *
          <textarea
            name="shortDescription"
            required
            maxLength={500}
            defaultValue={defaults.shortDescription}
            rows={3}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Full description
          <textarea name="description" defaultValue={defaults.description} rows={8} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
        <legend className="text-lg font-bold text-white sm:col-span-2">Date & time</legend>
        <label className={labelClass}>
          Start date *
          <input name="startDate" type="date" required defaultValue={defaults.startDate} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Start time *
          <input name="startTime" type="time" required defaultValue={defaults.startTime} className={fieldClass} />
        </label>
        <label className={labelClass}>
          End date
          <input name="endDate" type="date" defaultValue={defaults.endDate} className={fieldClass} />
        </label>
        <label className={labelClass}>
          End time
          <input name="endTime" type="time" defaultValue={defaults.endTime} className={fieldClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Timezone
          <input name="timezone" defaultValue={defaults.timezone} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
        <legend className="text-lg font-bold text-white sm:col-span-2">Location</legend>
        <label className={`${labelClass} sm:col-span-2`}>
          Location type
          <select
            name="locationType"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as typeof locationType)}
            className={fieldClass}
          >
            <option value="IN_PERSON">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        {showVenue ? (
          <>
            <label className={labelClass}>
              Venue name
              <input name="venueName" defaultValue={defaults.venueName} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Address
              <input name="addressLine" defaultValue={defaults.addressLine} className={fieldClass} />
            </label>
            <label className={labelClass}>
              City
              <input name="city" defaultValue={defaults.city} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Province
              <input name="province" defaultValue={defaults.province} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Postal code
              <input name="postalCode" defaultValue={defaults.postalCode} className={fieldClass} />
            </label>
          </>
        ) : null}
        {showOnline ? (
          <>
            <label className={labelClass}>
              Platform
              <input name="onlinePlatform" defaultValue={defaults.onlinePlatform} className={fieldClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Private meeting URL (never shown publicly)
              <input name="onlineUrl" defaultValue={defaults.onlineUrl} className={fieldClass} />
            </label>
          </>
        ) : null}
      </fieldset>

      <fieldset disabled={!canWrite} className="space-y-4">
        <legend className="text-lg font-bold text-white">Images</legend>
        <p className="text-sm text-white/50">Upload JPG, PNG, WebP or AVIF images. Maximum 8 MB per image.</p>

        <div className="space-y-3">
          <p className={labelClass}>Cover image</p>
          <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
          <input
            ref={coverInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => void handleCoverSelected(e.target.files)}
          />
          {coverImageUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImageUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm text-[#f1328b]"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                >
                  Change image
                </button>
                <button
                  type="button"
                  className="text-sm text-white/50"
                  onClick={() => {
                    setCoverImageUrl('');
                    setCoverError(null);
                  }}
                  disabled={coverUploading}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-[#f1328b]/40"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              Choose image
            </button>
          )}
          {coverUploading ? <p className="text-sm text-white/55">Uploading...</p> : null}
          {coverError ? (
            <p className="text-sm text-red-200" role="alert">
              {coverError}
            </p>
          ) : null}
        </div>

        <label className={labelClass}>
          Cover image alt text
          <input name="coverImageAlt" defaultValue={defaults.coverImageAlt} className={fieldClass} />
        </label>

        <div>
          <p className="text-sm font-semibold text-white">Gallery</p>
          <input
            ref={galleryInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => void handleGallerySelected(e.target.files)}
          />
          <div className="mt-3 space-y-3">
            {gallery.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-20 w-full rounded-lg object-cover sm:h-16 sm:w-24" />
                ) : (
                  <div className="h-20 rounded-lg bg-white/5 sm:h-16 sm:w-24" />
                )}
                <input
                  value={item.altText}
                  onChange={(e) =>
                    setGallery((rows) =>
                      rows.map((row) => (row.id === item.id ? { ...row, altText: e.target.value } : row))
                    )
                  }
                  placeholder="Alt text"
                  className={fieldClass}
                />
                <button
                  type="button"
                  className="text-xs text-white/50"
                  onClick={() => setGallery((rows) => rows.filter((row) => row.id !== item.id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-[#f1328b]"
            onClick={() => galleryInputRef.current?.click()}
            disabled={galleryUploading}
          >
            Add images
          </button>
          {galleryUploading ? <p className="mt-2 text-sm text-white/55">Uploading...</p> : null}
          {galleryError ? (
            <p className="mt-2 text-sm text-red-200" role="alert">
              {galleryError}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
        <legend className="text-lg font-bold text-white sm:col-span-2">Registration</legend>
        <label className={`${labelClass} sm:col-span-2`}>
          Registration type
          <select
            name="registrationType"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value as typeof registrationType)}
            className={fieldClass}
          >
            <option value="LEARN_MORE">Learn more only</option>
            <option value="NO_REGISTRATION">No registration</option>
            <option value="EXTERNAL_REGISTRATION">External registration URL</option>
            <option value="INTERNAL_REGISTRATION">Internal LoveCry registration</option>
          </select>
        </label>
        {registrationType === 'EXTERNAL_REGISTRATION' ? (
          <label className={`${labelClass} sm:col-span-2`}>
            Registration URL *
            <input name="registrationUrl" defaultValue={defaults.registrationUrl} className={fieldClass} />
          </label>
        ) : (
          <input type="hidden" name="registrationUrl" value={defaults.registrationUrl} />
        )}
        <label className={labelClass}>
          Registration deadline date
          <input name="registrationDeadlineDate" type="date" defaultValue={defaults.registrationDeadlineDate} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Registration deadline time
          <input name="registrationDeadlineTime" type="time" defaultValue={defaults.registrationDeadlineTime} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Capacity
          <input name="capacity" type="number" min={1} defaultValue={defaults.capacity} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Button label
          <input name="ctaLabel" defaultValue={defaults.ctaLabel} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset disabled={!canWrite} className="space-y-4">
        <legend className="text-lg font-bold text-white">Community impact</legend>
        <p className="text-sm text-white/50">
          Leave metrics blank unless verified. Blank values are hidden on the public site — they are never shown as 0.
        </p>
        <label className={labelClass}>
          What happened?
          <textarea name="impactSummary" defaultValue={defaults.impactSummary} rows={5} className={fieldClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Attendees
            <input name="attendeesCount" type="number" min={0} defaultValue={defaults.attendeesCount} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Volunteers
            <input name="volunteersCount" type="number" min={0} defaultValue={defaults.volunteersCount} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Volunteer hours
            <input name="volunteerHours" type="number" min={0} defaultValue={defaults.volunteerHours} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Activities
            <input name="activitiesCount" type="number" min={0} defaultValue={defaults.activitiesCount} className={fieldClass} />
          </label>
          <label className={labelClass}>
            People reached
            <input name="peopleReached" type="number" min={0} defaultValue={defaults.peopleReached} className={fieldClass} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Highlights</p>
          <div className="mt-3 space-y-2">
            {highlights.map((text, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) =>
                    setHighlights((rows) => rows.map((row, i) => (i === index ? e.target.value : row)))
                  }
                  className={fieldClass}
                  placeholder="Highlight"
                />
                <button
                  type="button"
                  className="text-xs text-white/50"
                  onClick={() => setHighlights((rows) => rows.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-[#f1328b]"
            onClick={() => setHighlights((rows) => [...rows, ''])}
          >
            + Add highlight
          </button>
        </div>
      </fieldset>

      {canWrite ? (
        <button
          type="submit"
          disabled={uploadPending}
          className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {uploadPending ? 'Uploading images…' : mode === 'create' ? 'Save draft' : 'Save changes'}
        </button>
      ) : (
        <p className="text-sm text-white/50">You have read-only access to events.</p>
      )}
    </form>
  );
}
