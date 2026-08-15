'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import {
  archiveEvent,
  cancelEvent,
  cancelRegistration,
  createEvent,
  deleteEvent,
  EventServiceError,
  publishEvent,
  unpublishEvent,
  updateEvent,
} from '@/lib/events/service';

function revalidateEventPaths(slug?: string) {
  revalidatePath('/events');
  revalidatePath('/admin/events');
  revalidatePath('/member/events');
  if (slug) revalidatePath(`/events/${slug}`);
}

function formToEventInput(formData: FormData) {
  let highlights: Array<{ text: string }> = [];
  let gallery: Array<{ url: string; altText?: string | null }> = [];
  try {
    const rawHighlights = JSON.parse(String(formData.get('highlightsJson') || '[]')) as unknown;
    const rawGallery = JSON.parse(String(formData.get('galleryJson') || '[]')) as unknown;
    highlights = Array.isArray(rawHighlights) ? (rawHighlights as Array<{ text: string }>) : [];
    gallery = Array.isArray(rawGallery)
      ? (rawGallery as Array<{ url: string; altText?: string | null }>)
      : [];
  } catch {
    throw new EventServiceError('Invalid highlights or gallery data');
  }

  return {
    title: String(formData.get('title') || ''),
    slug: String(formData.get('slug') || ''),
    shortDescription: String(formData.get('shortDescription') || ''),
    description: String(formData.get('description') || ''),
    eventCategory: String(formData.get('eventCategory') || ''),
    startDate: String(formData.get('startDate') || ''),
    startTime: String(formData.get('startTime') || ''),
    endDate: String(formData.get('endDate') || ''),
    endTime: String(formData.get('endTime') || ''),
    timezone: String(formData.get('timezone') || 'America/Toronto'),
    locationType: String(formData.get('locationType') || 'IN_PERSON'),
    venueName: String(formData.get('venueName') || ''),
    addressLine: String(formData.get('addressLine') || ''),
    city: String(formData.get('city') || ''),
    province: String(formData.get('province') || ''),
    postalCode: String(formData.get('postalCode') || ''),
    onlinePlatform: String(formData.get('onlinePlatform') || ''),
    onlineUrl: String(formData.get('onlineUrl') || ''),
    coverImageUrl: String(formData.get('coverImageUrl') || ''),
    coverImageAlt: String(formData.get('coverImageAlt') || ''),
    registrationType: String(formData.get('registrationType') || 'LEARN_MORE'),
    registrationUrl: String(formData.get('registrationUrl') || ''),
    registrationDeadlineDate: String(formData.get('registrationDeadlineDate') || ''),
    registrationDeadlineTime: String(formData.get('registrationDeadlineTime') || ''),
    capacity: String(formData.get('capacity') || ''),
    ctaLabel: String(formData.get('ctaLabel') || ''),
    impactSummary: String(formData.get('impactSummary') || ''),
    attendeesCount: String(formData.get('attendeesCount') || ''),
    volunteersCount: String(formData.get('volunteersCount') || ''),
    volunteerHours: String(formData.get('volunteerHours') || ''),
    activitiesCount: String(formData.get('activitiesCount') || ''),
    peopleReached: String(formData.get('peopleReached') || ''),
    highlights,
    gallery,
  };
}

function failRedirect(path: string, err: unknown): never {
  if (err instanceof AuthError) redirect('/admin');
  const message = err instanceof EventServiceError ? err.message : 'Something went wrong.';
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createEventAction(formData: FormData) {
  try {
    const admin = await requirePermission('events.write');
    const event = await createEvent(formToEventInput(formData), admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events/${event.id}/edit?saved=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect('/admin/events/new', err);
    }
    throw err;
  }
}

export async function updateEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    const event = await updateEvent(id, formToEventInput(formData), admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events/${event.id}/edit?saved=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function publishEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    const event = await publishEvent(id, admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events/${id}/edit?published=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function unpublishEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    const event = await unpublishEvent(id, admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events/${id}/edit?unpublished=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function cancelEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    const event = await cancelEvent(id, admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events/${id}/edit?cancelled=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function archiveEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    const event = await archiveEvent(id, admin.id);
    revalidateEventPaths(event.slug);
    redirect(`/admin/events?archived=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function deleteEventAction(formData: FormData) {
  const id = String(formData.get('eventId') || '');
  try {
    const admin = await requirePermission('events.write');
    await deleteEvent(id, admin.id);
    revalidateEventPaths();
    redirect('/admin/events?deleted=1');
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${id}/edit`, err);
    }
    throw err;
  }
}

export async function cancelRegistrationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') || '');
  const registrationId = String(formData.get('registrationId') || '');
  try {
    const admin = await requirePermission('events.write');
    await cancelRegistration(eventId, registrationId, admin.id);
    revalidatePath(`/admin/events/${eventId}`);
    redirect(`/admin/events/${eventId}?regcancelled=1`);
  } catch (err) {
    if (err instanceof AuthError || err instanceof EventServiceError) {
      failRedirect(`/admin/events/${eventId}`, err);
    }
    throw err;
  }
}
