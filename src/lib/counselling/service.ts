import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { counsellingEnv } from '@/lib/config/counselling-env';
import { donationEnv } from '@/lib/config/env';
import { acquireBookingLock, bookingLockName, releaseBookingLock } from '@/lib/db/locks';
import { prisma } from '@/lib/db/prisma';
import {
  cancelCalendarEvent,
  createCalendarEvent,
  getBusyIntervals,
  updateCalendarEvent,
} from '@/lib/google/calendar';
import { getCalendarReadinessForBooking } from '@/lib/google/calendar-readiness';
import { logError, logInfo } from '@/lib/security/logger';
import { generateSlotsForDate, isSlotAvailable } from './availability';
import { deliverCounsellingEmail } from './email';
import { mapAppointment } from './mappers';
import {
  addAudit,
  deleteHold,
  getActiveConsentTemplate,
  getAppointment,
  getAppointmentByConsentHash,
  getAppointmentByIdempotencyKey,
  getAppointmentByManageHash,
  getCounsellor,
  getHoldByTokenHash,
  getService,
  getSettings,
  getSignedConsent,
  listAppointments,
  updateAppointmentIntake,
  upsertAppointment,
  upsertHold,
  upsertSignedConsent,
} from './store';
import {
  counsellorFirstName,
  durationMinutesBetween,
  formatClockTime,
  formatDateUpper,
  formatDisplayTimeRange,
  formatWeekdayDate,
  formatWeekdayDateShort,
} from './display';
import { formatInTz } from './time-zone';
import { generateToken, hashToken, nextAppointmentReference, sha256 } from './tokens';
import type {
  AppointmentMode,
  AppointmentRecord,
  ClientSnapshot,
  IntakeAnswers,
  SignatureMethod,
} from './types';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CONSENT_OVERDUE'] as const;

type BookingErrorCode = 'CONFLICT' | 'SYNC_FAILED' | 'VALIDATION' | 'UNAVAILABLE';

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function busyOverlapsSlot(
  busy: Array<{ start: Date; end: Date }>,
  start: Date,
  end: Date
): boolean {
  return busy.some((b) => overlaps(b.start, b.end, start, end));
}

async function reissueTokens(appointmentId: string): Promise<{ manageToken: string; consentToken: string }> {
  const manageToken = generateToken();
  const consentToken = generateToken();
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      manageTokenHash: hashToken(manageToken),
      consentTokenHash: hashToken(consentToken),
    },
  });
  return { manageToken, consentToken };
}

export async function createHold(startTimeUtc: string, endTimeUtc: string) {
  const settings = await getSettings();
  const counsellor = await getCounsellor();
  const available = await isSlotAvailable(startTimeUtc, endTimeUtc);
  if (!available) {
    return { ok: false as const, error: 'That time is no longer available.' };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + settings.holdMinutes * 60_000).toISOString();

  await upsertHold({
    id: crypto.randomUUID(),
    counsellorId: counsellor.id,
    startTimeUtc,
    endTimeUtc,
    tokenHash,
    rawToken,
    expiresAt,
  });

  return { ok: true as const, holdToken: rawToken, expiresAt, startTimeUtc, endTimeUtc };
}

export async function releaseHold(holdToken: string): Promise<boolean> {
  const hash = hashToken(holdToken);
  const hold = await getHoldByTokenHash(hash);
  if (!hold) return false;
  await deleteHold(hash);
  return true;
}

export type CreateBookingInput = {
  holdToken: string;
  serviceId: string;
  appointmentMode: AppointmentMode;
  client: ClientSnapshot;
  intakeAnswers: IntakeAnswers;
  clientNotes?: string;
  signature?: {
    legalName: string;
    method: SignatureMethod;
    signatureDataUrl?: string;
    acknowledgements: string[];
  };
  idempotencyKey?: string;
};

async function finalizeIdempotentBooking(
  existing: AppointmentRecord,
  googleRequired: boolean,
  settings: Awaited<ReturnType<typeof getSettings>>
): Promise<
  | { ok: true; appointment: AppointmentRecord; manageToken: string; consentToken: string }
  | { ok: false; error: string; code: BookingErrorCode }
> {
  if (existing.status.startsWith('CANCELLED')) {
    return {
      ok: false,
      error: 'A previous booking with this request was cancelled. Please start a new booking.',
      code: 'CONFLICT',
    };
  }

  const syncedOk =
    existing.googleSyncStatus === 'SYNCED' ||
    (!googleRequired && existing.googleSyncStatus === 'NOT_SYNCED');

  if (syncedOk) {
    const tokens = await reissueTokens(existing.id);
    const appointment = (await getAppointment(existing.id))!;
    return { ok: true, appointment, ...tokens };
  }

  if (
    googleRequired &&
    (existing.googleSyncStatus === 'SYNC_FAILED' || existing.googleSyncStatus === 'PENDING')
  ) {
    let appointment = existing;
    if (!appointment.googleCalendarEventId) {
      try {
        const createMeet =
          appointment.appointmentMode === 'VIRTUAL' && settings.googleMeetEnabled;
        const cal = await createCalendarEvent({
          reference: appointment.referenceNumber,
          startUtc: new Date(appointment.startTimeUtc),
          endUtc: new Date(appointment.endTimeUtc),
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          clientEmail: appointment.client.email,
          clientPhone: appointment.client.phone,
          mode: appointment.appointmentMode,
          consentStatus: appointment.consentStatus,
          createMeet,
        });
        appointment = await upsertAppointment({
          ...appointment,
          status: 'CONFIRMED',
          googleCalendarEventId: cal.eventId,
          googleCalendarId: cal.calendarId,
          googleMeetUrl: cal.meetUrl,
          googleEventHtmlLink: cal.htmlLink,
          googleSyncStatus: 'SYNCED',
          googleSyncedAt: new Date().toISOString(),
          googleSyncError: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google Calendar sync failed';
        logError('google_calendar_event_failed', {
          bookingId: appointment.id,
          integration: 'google_calendar',
          action: 'create_retry',
          status: 'SYNC_FAILED',
          errorCode: 'GOOGLE_CREATE_FAILED',
          message,
        });
        appointment = await upsertAppointment({
          ...appointment,
          status: 'PENDING',
          googleSyncStatus: 'SYNC_FAILED',
          googleSyncError: 'Calendar synchronization failed. Staff will confirm shortly.',
        });
        return {
          ok: false,
          error:
            'Your booking could not be confirmed because calendar synchronization failed. Please try another time or contact LoveCry.',
          code: 'SYNC_FAILED',
        };
      }
    } else {
      appointment = await upsertAppointment({
        ...appointment,
        status: 'CONFIRMED',
        googleSyncStatus: 'SYNCED',
        googleSyncedAt: new Date().toISOString(),
        googleSyncError: null,
      });
    }

    const tokens = await reissueTokens(appointment.id);
    appointment = (await getAppointment(appointment.id))!;
    return { ok: true, appointment, ...tokens };
  }

  return {
    ok: false,
    error: 'Unable to complete booking. Please try again.',
    code: 'VALIDATION',
  };
}

export async function createBooking(
  input: CreateBookingInput
): Promise<
  | { ok: true; appointment: AppointmentRecord; manageToken: string; consentToken: string }
  | { ok: false; error: string; code?: BookingErrorCode }
> {
  const readiness = await getCalendarReadinessForBooking();
  if (!readiness.ok) {
    return { ok: false, error: readiness.message, code: 'UNAVAILABLE' };
  }
  const googleRequired = readiness.mode === 'connected';

  const settings = await getSettings();

  if (input.idempotencyKey) {
    const existing = await getAppointmentByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return finalizeIdempotentBooking(existing, googleRequired, settings);
    }
  }

  const holdHash = hashToken(input.holdToken);
  const hold = await getHoldByTokenHash(holdHash);

  if (!hold || hold.convertedAt) {
    return { ok: false, error: 'Your time hold expired. Please select a new time slot.', code: 'VALIDATION' };
  }
  if (new Date(hold.expiresAt).getTime() < Date.now()) {
    await deleteHold(holdHash);
    return { ok: false, error: 'Your time hold expired. Please select a new time slot.', code: 'VALIDATION' };
  }

  const service = await getService(input.serviceId);
  if (!service) return { ok: false, error: 'Service not found.', code: 'VALIDATION' };

  if (settings.consentRequiredBeforeConfirm && !input.signature) {
    return {
      ok: false,
      error: 'Consent signature is required before booking can be confirmed.',
      code: 'VALIDATION',
    };
  }

  const slotStart = new Date(hold.startTimeUtc);
  const slotEnd = new Date(hold.endTimeUtc);

  if (googleRequired) {
    const busy = await getBusyIntervals(slotStart, slotEnd);
    if (busyOverlapsSlot(busy, slotStart, slotEnd)) {
      return { ok: false, error: 'That time is no longer available. Please choose another slot.', code: 'CONFLICT' };
    }
  }

  const manageToken = generateToken();
  const consentToken = generateToken();
  const counsellor = await getCounsellor();
  const lockName = bookingLockName(counsellor.id);

  const location =
    input.appointmentMode === 'IN_PERSON'
      ? settings.inPersonLocation
      : input.appointmentMode === 'PHONE'
        ? 'Phone appointment'
        : 'Virtual (Google Meet when configured)';

  const initialStatus = googleRequired ? 'PENDING' : 'CONFIRMED';
  const initialSync = googleRequired ? 'PENDING' : 'NOT_SYNCED';
  const createMeet = input.appointmentMode === 'VIRTUAL' && settings.googleMeetEnabled;

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const acquired = await acquireBookingLock(tx, lockName);
        if (!acquired) {
          throw Object.assign(new Error('LOCK_TIMEOUT'), { code: 'CONFLICT' });
        }

        try {
          if (input.idempotencyKey) {
            const prior = await tx.appointment.findUnique({
              where: { idempotencyKey: input.idempotencyKey },
              include: { client: true },
            });
            if (prior) {
              return { kind: 'idempotent' as const, appointment: mapAppointment(prior) };
            }
          }

          const freshHold = await tx.appointmentHold.findUnique({ where: { tokenHash: holdHash } });
          if (!freshHold || freshHold.convertedAt || freshHold.expiresAt.getTime() < Date.now()) {
            throw Object.assign(new Error('HOLD_EXPIRED'), { code: 'VALIDATION' });
          }

          const conflict = await tx.appointment.findFirst({
            where: {
              counsellorId: counsellor.id,
              status: { in: [...ACTIVE_STATUSES] },
              startTimeUtc: { lt: slotEnd },
              endTimeUtc: { gt: slotStart },
            },
          });
          if (conflict) {
            throw Object.assign(new Error('SLOT_TAKEN'), { code: 'CONFLICT' });
          }

          const otherHold = await tx.appointmentHold.findFirst({
            where: {
              counsellorId: counsellor.id,
              convertedAt: null,
              expiresAt: { gt: new Date() },
              tokenHash: { not: holdHash },
              startTimeUtc: { lt: slotEnd },
              endTimeUtc: { gt: slotStart },
            },
          });
          if (otherHold) {
            throw Object.assign(new Error('SLOT_HELD'), { code: 'CONFLICT' });
          }

          const year = new Date().getFullYear();
          const seqRow = await tx.appointmentSequence.upsert({
            where: { year },
            create: { year, lastValue: 1 },
            update: { lastValue: { increment: 1 } },
          });
          const reference = nextAppointmentReference(seqRow.lastValue, year);

          const client = await tx.counsellingClient.create({
            data: {
              firstName: input.client.firstName,
              lastName: input.client.lastName,
              email: input.client.email,
              phone: input.client.phone,
              preferredContactMethod: input.client.preferredContactMethod,
              preferredLanguage: input.client.preferredLanguage,
              safeToLeaveVoicemail: input.client.safeToLeaveVoicemail,
              safeToSendEmail: input.client.safeToSendEmail,
              accessibilityRequirements: input.client.accessibilityRequirements,
              emergencyContactName: input.client.emergencyContactName,
              emergencyContactPhone: input.client.emergencyContactPhone,
              emergencyRelationship: input.client.emergencyRelationship,
            },
          });

          const appt = await tx.appointment.create({
            data: {
              referenceNumber: reference,
              clientId: client.id,
              counsellorId: counsellor.id,
              serviceId: service.id,
              startTimeUtc: slotStart,
              endTimeUtc: slotEnd,
              timeZone: settings.timeZone,
              status: initialStatus,
              appointmentMode: input.appointmentMode,
              location,
              intakeAnswers: input.intakeAnswers,
              clientNotes: input.clientNotes,
              consentStatus: 'SENT',
              confirmationEmailStatus: 'PENDING',
              manageTokenHash: hashToken(manageToken),
              consentTokenHash: hashToken(consentToken),
              rescheduleCount: 0,
              googleSyncStatus: initialSync,
              idempotencyKey: input.idempotencyKey,
            },
            include: { client: true },
          });

          await tx.appointmentHold.update({
            where: { tokenHash: holdHash },
            data: { convertedAt: new Date() },
          });

          await tx.appointmentAuditEvent.create({
            data: {
              appointmentId: appt.id,
              actorType: 'CLIENT',
              action: 'BOOKING_CREATED',
              newData: { reference, startTimeUtc: hold.startTimeUtc },
            },
          });

          return {
            kind: 'created' as const,
            appointment: mapAppointment(appt),
            manageToken,
            consentToken,
          };
        } finally {
          await releaseBookingLock(tx, lockName);
        }
      },
      { timeout: 20000 }
    );

    if (created.kind === 'idempotent') {
      return finalizeIdempotentBooking(created.appointment, googleRequired, settings);
    }

    let appointment = created.appointment;

    if (googleRequired) {
      const finalBusy = await getBusyIntervals(slotStart, slotEnd);
      if (busyOverlapsSlot(finalBusy, slotStart, slotEnd)) {
        appointment = await upsertAppointment({
          ...appointment,
          status: 'CANCELLED_BY_ADMIN',
          cancellationReason: 'Calendar conflict detected after hold conversion',
          cancelledBy: 'SYSTEM',
          cancelledAt: new Date().toISOString(),
          googleSyncStatus: 'NOT_SYNCED',
          googleSyncError: null,
          updatedAt: new Date().toISOString(),
        });
        await addAudit({
          appointmentId: appointment.id,
          actorType: 'SYSTEM',
          action: 'BOOKING_CANCELLED',
          newData: { reason: 'calendar_conflict', status: appointment.status },
        });
        return {
          ok: false,
          error: 'That time is no longer available. Please choose another slot.',
          code: 'CONFLICT',
        };
      }

      try {
        const cal = await createCalendarEvent({
          reference: appointment.referenceNumber,
          startUtc: slotStart,
          endUtc: slotEnd,
          clientName: `${input.client.firstName} ${input.client.lastName}`,
          clientEmail: input.client.email,
          clientPhone: input.client.phone,
          mode: input.appointmentMode,
          consentStatus: appointment.consentStatus,
          createMeet,
        });

        appointment = await upsertAppointment({
          ...appointment,
          status: 'CONFIRMED',
          googleCalendarEventId: cal.eventId,
          googleCalendarId: cal.calendarId,
          googleMeetUrl: cal.meetUrl,
          googleEventHtmlLink: cal.htmlLink,
          googleSyncStatus: 'SYNCED',
          googleSyncedAt: new Date().toISOString(),
          googleSyncError: null,
        });
        logInfo('google_calendar_event_created', {
          bookingId: appointment.id,
          integration: 'google_calendar',
          action: 'create',
          status: 'SYNCED',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google Calendar sync failed';
        logError('google_calendar_event_failed', {
          bookingId: appointment.id,
          integration: 'google_calendar',
          action: 'create',
          status: 'SYNC_FAILED',
          errorCode: 'GOOGLE_CREATE_FAILED',
          message,
        });

        appointment = await upsertAppointment({
          ...appointment,
          status: 'PENDING',
          googleSyncStatus: 'SYNC_FAILED',
          googleSyncError: 'Calendar synchronization failed. Staff will confirm shortly.',
        });

        await addAudit({
          appointmentId: appointment.id,
          actorType: 'SYSTEM',
          action: 'GOOGLE_SYNC_FAILED',
          newData: { errorCode: 'GOOGLE_CREATE_FAILED' },
        });

        return {
          ok: false,
          error:
            'Your booking could not be confirmed because calendar synchronization failed. Please try another time or contact LoveCry.',
          code: 'SYNC_FAILED',
        };
      }
    }

    if (input.signature) {
      await applySignature(appointment.id, input.signature, undefined, undefined);
      appointment = (await getAppointment(appointment.id))!;
    }

    const emailStatus = await deliverCounsellingEmail({
      kind: 'booking_confirmation',
      appointment,
      manageToken: created.manageToken,
      consentToken: created.consentToken,
    });
    appointment = await upsertAppointment({
      ...appointment,
      confirmationEmailStatus: emailStatus,
      updatedAt: new Date().toISOString(),
    });

    if (appointment.consentStatus !== 'SIGNED' && input.client.safeToSendEmail) {
      await deliverCounsellingEmail({
        kind: 'consent_required',
        appointment,
        manageToken: created.manageToken,
        consentToken: created.consentToken,
      });
    }

    return {
      ok: true,
      appointment,
      manageToken: created.manageToken,
      consentToken: created.consentToken,
    };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'CONFLICT' || (err instanceof Error && /SLOT_|LOCK_/.test(err.message))) {
      return {
        ok: false,
        error: 'That time is no longer available. Please choose another slot.',
        code: 'CONFLICT',
      };
    }
    if (code === 'VALIDATION' || (err instanceof Error && err.message === 'HOLD_EXPIRED')) {
      return {
        ok: false,
        error: 'Your time hold expired. Please select a new time slot.',
        code: 'VALIDATION',
      };
    }
    logError('booking_create_failed', {
      action: 'createBooking',
      errorCode: 'BOOKING_FAILED',
      message: err instanceof Error ? err.message : 'unknown',
    });
    return { ok: false, error: 'Unable to complete booking. Please try again.', code: 'VALIDATION' };
  }
}

async function applySignature(
  appointmentId: string,
  signature: {
    legalName: string;
    method: SignatureMethod;
    signatureDataUrl?: string;
    acknowledgements: string[];
  },
  ip?: string,
  ua?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const appointment = await getAppointment(appointmentId);
  if (!appointment) return { ok: false, error: 'Appointment not found.' };
  if (['CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_COUNSELLOR'].includes(appointment.status)) {
    return { ok: false, error: 'Cannot sign consent for a cancelled appointment.' };
  }
  if (appointment.consentStatus === 'SIGNED') {
    return { ok: false, error: 'Consent is already signed.' };
  }

  const template = await getActiveConsentTemplate();
  if (!template) return { ok: false, error: 'No active consent form is available.' };

  if (!signature.legalName.trim()) return { ok: false, error: 'Legal name is required.' };
  if (signature.acknowledgements.length < 3) {
    return { ok: false, error: 'All consent acknowledgements are required.' };
  }
  if (signature.method === 'DRAWN' && !signature.signatureDataUrl) {
    return { ok: false, error: 'Drawn signature is required.' };
  }

  const signingSessionId = crypto.randomUUID();
  const signedAtUtc = new Date().toISOString();
  const certificateText = [
    'LoveCry Electronic Consent Certificate',
    `Document title: ${template.title}`,
    `Document version: ${template.version}`,
    `Booking reference: ${appointment.referenceNumber}`,
    `Client legal name: ${signature.legalName}`,
    `Client email: ${appointment.client.email}`,
    `Signature method: ${signature.method}`,
    `Signed date and time (UTC): ${signedAtUtc}`,
    `Signing-session ID: ${signingSessionId}`,
    `Original-document hash: ${template.documentHash}`,
    `Consent acknowledgements: ${signature.acknowledgements.join(' | ')}`,
    ip ? `Source IP (masked policy): ${ip}` : '',
    ua ? `User-agent summary: ${ua.slice(0, 180)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const finalDocument = `${template.bodyText}\n\n---\n${certificateText}\nSigned image present: ${Boolean(signature.signatureDataUrl)}`;
  const finalDocumentHash = sha256(finalDocument);

  const fileName = `LC-CONSENT-${appointment.referenceNumber.replace('LC-APT-', '')}.txt`;
  const consentsDir = path.join(process.cwd(), '.data', 'consents');
  await mkdir(consentsDir, { recursive: true });
  const safeRef = appointment.referenceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  await writeFile(path.join(consentsDir, `${safeRef}-certificate.txt`), certificateText, 'utf8');
  if (signature.signatureDataUrl) {
    await writeFile(path.join(consentsDir, `${safeRef}-signature.txt`), signature.signatureDataUrl, 'utf8');
  }

  const { uploadSignedConsentToDrive } = await import('@/lib/google/drive');
  const drive = await uploadSignedConsentToDrive({
    fileName,
    content: finalDocument,
    mimeType: 'text/plain',
  });

  await upsertSignedConsent({
    id: crypto.randomUUID(),
    appointmentId: appointment.id,
    consentTemplateId: template.id,
    status: 'SIGNED',
    clientLegalName: signature.legalName,
    clientEmail: appointment.client.email,
    signatureMethod: signature.method,
    signatureDataUrl: signature.signatureDataUrl,
    signatureStorageKey: `local:${safeRef}`,
    signingSessionId,
    signedAtUtc,
    sourceIp: ip,
    userAgent: ua,
    originalDocumentHash: template.documentHash,
    finalDocumentHash,
    certificateText,
    googleDriveFileId: drive.fileId,
    finalFileName: fileName,
    acknowledgements: signature.acknowledgements,
    artifactStatus: 'LOCAL_STORED',
  });

  appointment.consentStatus = 'SIGNED';
  appointment.consentTokenHash = undefined;
  appointment.updatedAt = new Date().toISOString();
  await upsertAppointment(appointment);

  await addAudit({
    appointmentId: appointment.id,
    actorType: 'CLIENT',
    action: 'CONSENT_SIGNED',
    newData: { signingSessionId, finalDocumentHash },
  });

  await deliverCounsellingEmail({
    kind: 'consent_signed',
    appointment,
  });

  return { ok: true };
}

export async function resolveConsentOrManageToken(token: string): Promise<AppointmentRecord | undefined> {
  return (
    (await getAppointmentByConsentHash(hashToken(token))) ||
    (await getAppointmentByManageHash(hashToken(token)))
  );
}

export async function signConsentWithToken(
  consentToken: string,
  signature: {
    legalName: string;
    method: SignatureMethod;
    signatureDataUrl?: string;
    acknowledgements: string[];
  },
  ip?: string,
  ua?: string
) {
  const appointment = await resolveConsentOrManageToken(consentToken);
  if (!appointment) return { ok: false as const, error: 'Invalid or expired signing link.' };
  return applySignature(appointment.id, signature, ip, ua);
}

export async function resolveManageToken(token: string): Promise<AppointmentRecord | undefined> {
  return getAppointmentByManageHash(hashToken(token));
}

export async function cancelBooking(
  manageTokenOrId: string,
  reason: string | undefined,
  actor: 'CLIENT' | 'ADMIN'
): Promise<
  | { ok: true; appointment: AppointmentRecord }
  | { ok: false; error: string; code?: BookingErrorCode }
> {
  const appt =
    (await resolveManageToken(manageTokenOrId)) ||
    (actor === 'ADMIN' ? await getAppointment(manageTokenOrId) : undefined);

  if (!appt) return { ok: false, error: 'Invalid management link.', code: 'VALIDATION' };
  if (appt.status.startsWith('CANCELLED')) {
    return { ok: true, appointment: appt };
  }

  const previous = { ...appt };
  const cancelledAt = new Date().toISOString();
  let appointment = await upsertAppointment({
    ...appt,
    status: actor === 'CLIENT' ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_ADMIN',
    cancellationReason: reason,
    cancelledBy: actor,
    cancelledAt,
    updatedAt: cancelledAt,
  });

  if (appointment.googleCalendarEventId) {
    try {
      await cancelCalendarEvent(appointment.googleCalendarEventId);
      appointment = await upsertAppointment({
        ...appointment,
        googleSyncStatus: 'CANCELLED',
        googleSyncedAt: new Date().toISOString(),
        googleSyncError: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'cancel failed';
      logError('google_calendar_cancel_failed', {
        bookingId: appointment.id,
        integration: 'google_calendar',
        action: 'cancel',
        errorCode: 'GOOGLE_CANCEL_FAILED',
        message,
      });
      appointment = await upsertAppointment({
        ...appointment,
        googleSyncStatus: 'SYNC_FAILED',
        googleSyncError: 'Calendar cancellation may be out of sync. Staff will verify.',
      });
    }
  }

  await addAudit({
    appointmentId: appointment.id,
    actorType: actor,
    action: 'BOOKING_CANCELLED',
    previousData: { status: previous.status },
    newData: { status: appointment.status, reason },
  });

  await deliverCounsellingEmail({ kind: 'cancelled', appointment });

  return { ok: true, appointment };
}

export async function rescheduleBooking(
  manageToken: string,
  holdToken: string,
  actor: 'CLIENT' | 'ADMIN' = 'CLIENT'
): Promise<
  | { ok: true; appointment: AppointmentRecord }
  | { ok: false; error: string; code?: BookingErrorCode }
> {
  const readiness = await getCalendarReadinessForBooking();
  if (!readiness.ok) {
    return { ok: false, error: readiness.message, code: 'UNAVAILABLE' };
  }
  const googleRequired = readiness.mode === 'connected';

  const appt =
    (await resolveManageToken(manageToken)) ||
    (actor === 'ADMIN' ? await getAppointment(manageToken) : undefined);
  if (!appt) return { ok: false, error: 'Invalid management link.', code: 'VALIDATION' };
  if (appt.status.startsWith('CANCELLED')) {
    return { ok: false, error: 'Cancelled appointments cannot be rescheduled.', code: 'VALIDATION' };
  }
  if (actor === 'CLIENT' && appt.rescheduleCount >= 3) {
    return { ok: false, error: 'Maximum reschedules reached. Please contact LoveCry.', code: 'VALIDATION' };
  }

  const holdHash = hashToken(holdToken);
  const hold = await getHoldByTokenHash(holdHash);
  if (!hold || hold.convertedAt || new Date(hold.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: 'Hold expired. Select a new time.', code: 'VALIDATION' };
  }

  const available = await isSlotAvailable(hold.startTimeUtc, hold.endTimeUtc, holdHash, appt.id);
  if (!available) {
    return { ok: false, error: 'That time is no longer available.', code: 'CONFLICT' };
  }

  const newStart = new Date(hold.startTimeUtc);
  const newEnd = new Date(hold.endTimeUtc);
  const oldStart = appt.startTimeUtc;
  const oldEnd = appt.endTimeUtc;
  const lockName = bookingLockName(appt.counsellorId);

  try {
    await prisma.$transaction(
      async (tx) => {
        const acquired = await acquireBookingLock(tx, lockName);
        if (!acquired) {
          throw Object.assign(new Error('LOCK_TIMEOUT'), { code: 'CONFLICT' });
        }
        try {
          const freshHold = await tx.appointmentHold.findUnique({ where: { tokenHash: holdHash } });
          if (!freshHold || freshHold.convertedAt || freshHold.expiresAt.getTime() < Date.now()) {
            throw Object.assign(new Error('HOLD_EXPIRED'), { code: 'VALIDATION' });
          }

          const conflict = await tx.appointment.findFirst({
            where: {
              id: { not: appt.id },
              counsellorId: appt.counsellorId,
              status: { in: [...ACTIVE_STATUSES] },
              startTimeUtc: { lt: newEnd },
              endTimeUtc: { gt: newStart },
            },
          });
          if (conflict) {
            throw Object.assign(new Error('SLOT_TAKEN'), { code: 'CONFLICT' });
          }

          const otherHold = await tx.appointmentHold.findFirst({
            where: {
              counsellorId: appt.counsellorId,
              convertedAt: null,
              expiresAt: { gt: new Date() },
              tokenHash: { not: holdHash },
              startTimeUtc: { lt: newEnd },
              endTimeUtc: { gt: newStart },
            },
          });
          if (otherHold) {
            throw Object.assign(new Error('SLOT_HELD'), { code: 'CONFLICT' });
          }
        } finally {
          await releaseBookingLock(tx, lockName);
        }
      },
      { timeout: 15000 }
    );
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'VALIDATION' || (err instanceof Error && err.message === 'HOLD_EXPIRED')) {
      return { ok: false, error: 'Hold expired. Select a new time.', code: 'VALIDATION' };
    }
    return { ok: false, error: 'That time is no longer available.', code: 'CONFLICT' };
  }

  let googleHtmlLink = appt.googleEventHtmlLink;
  let googleEventId = appt.googleCalendarEventId;
  let googleCalendarId = appt.googleCalendarId;
  let googleMeetUrl = appt.googleMeetUrl;
  let googleSyncStatus = appt.googleSyncStatus;
  let googleSyncedAt = appt.googleSyncedAt;
  let googleSyncError = appt.googleSyncError;

  if (googleRequired) {
    const busy = await getBusyIntervals(newStart, newEnd);
    // Own event at the old slot does not block the new slot unless times overlap other busy.
    if (busyOverlapsSlot(busy, newStart, newEnd)) {
      // Filter exact match of current appointment window (own event) if present.
      const otherBusy = busy.filter(
        (b) =>
          !(
            b.start.getTime() === new Date(oldStart).getTime() &&
            b.end.getTime() === new Date(oldEnd).getTime()
          )
      );
      if (busyOverlapsSlot(otherBusy, newStart, newEnd)) {
        return { ok: false, error: 'That time is no longer available.', code: 'CONFLICT' };
      }
    }

    try {
      if (googleEventId) {
        const updated = await updateCalendarEvent(googleEventId, {
          startUtc: newStart,
          endUtc: newEnd,
        });
        googleHtmlLink = updated.htmlLink ?? googleHtmlLink;
        googleSyncStatus = 'SYNCED';
        googleSyncedAt = new Date().toISOString();
        googleSyncError = null;
      } else {
        const settings = await getSettings();
        const createMeet = appt.appointmentMode === 'VIRTUAL' && settings.googleMeetEnabled;
        const cal = await createCalendarEvent({
          reference: appt.referenceNumber,
          startUtc: newStart,
          endUtc: newEnd,
          clientName: `${appt.client.firstName} ${appt.client.lastName}`,
          clientEmail: appt.client.email,
          clientPhone: appt.client.phone,
          mode: appt.appointmentMode,
          consentStatus: appt.consentStatus,
          createMeet,
        });
        googleEventId = cal.eventId;
        googleCalendarId = cal.calendarId;
        googleMeetUrl = cal.meetUrl;
        googleHtmlLink = cal.htmlLink;
        googleSyncStatus = 'SYNCED';
        googleSyncedAt = new Date().toISOString();
        googleSyncError = null;
      }
    } catch (err) {
      logError('google_calendar_reschedule_failed', {
        bookingId: appt.id,
        integration: 'google_calendar',
        action: 'reschedule',
        errorCode: 'GOOGLE_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'unknown',
      });
      return {
        ok: false,
        error: 'Unable to reschedule because calendar synchronization failed. Please try again.',
        code: 'SYNC_FAILED',
      };
    }
  }

  try {
    const updatedAt = new Date().toISOString();
    hold.convertedAt = updatedAt;
    await upsertHold(hold);

    const appointment = await upsertAppointment({
      ...appt,
      startTimeUtc: hold.startTimeUtc,
      endTimeUtc: hold.endTimeUtc,
      rescheduleCount: appt.rescheduleCount + 1,
      googleCalendarEventId: googleEventId,
      googleCalendarId,
      googleMeetUrl,
      googleEventHtmlLink: googleHtmlLink,
      googleSyncStatus,
      googleSyncedAt,
      googleSyncError,
      updatedAt,
    });

    await addAudit({
      appointmentId: appointment.id,
      actorType: actor,
      action: 'BOOKING_RESCHEDULED',
      previousData: { startTimeUtc: oldStart, endTimeUtc: oldEnd },
      newData: { startTimeUtc: appointment.startTimeUtc, endTimeUtc: appointment.endTimeUtc },
    });

    await deliverCounsellingEmail({ kind: 'rescheduled', appointment });

    return { ok: true, appointment };
  } catch (err) {
    logError('booking_reschedule_mysql_failed', {
      bookingId: appt.id,
      action: 'reschedule',
      message: err instanceof Error ? err.message : 'unknown',
    });

    if (googleRequired && googleEventId && appt.googleCalendarEventId) {
      try {
        await updateCalendarEvent(googleEventId, {
          startUtc: new Date(oldStart),
          endUtc: new Date(oldEnd),
        });
      } catch (compErr) {
        logError('google_calendar_reschedule_compensate_failed', {
          bookingId: appt.id,
          integration: 'google_calendar',
          action: 'reschedule_compensate',
          message: compErr instanceof Error ? compErr.message : 'unknown',
        });
        await upsertAppointment({
          ...appt,
          googleSyncStatus: 'SYNC_FAILED',
          googleSyncError: 'Reschedule partially applied; calendar may be out of sync.',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      ok: false,
      error: 'Unable to reschedule. Please try again.',
      code: 'VALIDATION',
    };
  }
}

export async function getPublicBookingSummary(
  appt: AppointmentRecord,
  tokens?: { manageToken?: string; consentToken?: string }
) {
  const counsellor = await getCounsellor();
  const service = await getService(appt.serviceId);
  const settings = await getSettings();
  const signed = await getSignedConsent(appt.id);
  return {
    referenceNumber: appt.referenceNumber,
    status: appt.status,
    consentStatus: appt.consentStatus,
    appointmentMode: appt.appointmentMode,
    location: appt.location,
    googleMeetUrl: appt.googleMeetUrl,
    googleSyncStatus: appt.googleSyncStatus,
    startTimeUtc: appt.startTimeUtc,
    endTimeUtc: appt.endTimeUtc,
    timeZone: appt.timeZone,
    displayDate: formatInTz(appt.startTimeUtc, { dateStyle: 'full' }, appt.timeZone),
    displayTime: formatInTz(appt.startTimeUtc, { timeStyle: 'short' }, appt.timeZone),
    displayEndTime: formatClockTime(appt.endTimeUtc, appt.timeZone),
    displayTimeRange: formatDisplayTimeRange(appt.startTimeUtc, appt.endTimeUtc, appt.timeZone),
    displayWeekdayDate: formatWeekdayDate(appt.startTimeUtc, appt.timeZone),
    displayWeekdayDateShort: formatWeekdayDateShort(appt.startTimeUtc, appt.timeZone),
    displayDateUpper: formatDateUpper(appt.startTimeUtc, appt.timeZone),
    durationMinutes: durationMinutesBetween(appt.startTimeUtc, appt.endTimeUtc),
    counsellorName: counsellor.displayName,
    counsellorFirstName: counsellorFirstName(counsellor.displayName),
    serviceName: service?.name,
    clientFirstName: appt.client.firstName,
    consentSignedAt: signed?.signedAtUtc,
    crisisMessage: settings.crisisMessage,
    managePath: tokens?.manageToken ? `/bookings/manage/${tokens.manageToken}` : undefined,
    consentPath: tokens?.consentToken ? `/consent/sign/${tokens.consentToken}` : undefined,
    intakePath: tokens?.manageToken ? `/bookings/intake/${tokens.manageToken}` : undefined,
  };
}

export async function getIntakeForManageToken(token: string) {
  const appt = await resolveManageToken(token);
  if (!appt) {
    return { ok: false as const, error: 'Invalid or expired link.', code: 'NOT_FOUND' };
  }
  if (appt.status.startsWith('CANCELLED')) {
    return { ok: false as const, error: 'This appointment has been cancelled.', code: 'CANCELLED' };
  }

  return {
    ok: true as const,
    intakeAnswers: appt.intakeAnswers ?? {},
    summary: await getPublicBookingSummary(appt, { manageToken: token }),
  };
}

export async function saveIntakeAnswers(token: string, answers: IntakeAnswers) {
  const appt = await resolveManageToken(token);
  if (!appt) {
    return { ok: false as const, error: 'Invalid or expired link.', code: 'NOT_FOUND' };
  }
  if (appt.status.startsWith('CANCELLED')) {
    return { ok: false as const, error: 'This appointment has been cancelled.', code: 'CANCELLED' };
  }

  const previous = appt.intakeAnswers ?? {};
  const cleaned: IntakeAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (value !== undefined) cleaned[key] = value;
  }
  const next: IntakeAnswers = { ...previous, ...cleaned };
  const updated = await updateAppointmentIntake(appt.id, next);
  if (!updated) {
    return { ok: false as const, error: 'Could not save intake answers.', code: 'VALIDATION' };
  }

  await addAudit({
    appointmentId: appt.id,
    actorType: 'CLIENT',
    action: 'INTAKE_UPDATED',
    previousData: previous,
    newData: next,
  });

  return { ok: true as const, intakeAnswers: next };
}

export { generateSlotsForDate, listAppointments, getSettings, formatInTz, counsellingEnv, donationEnv };
