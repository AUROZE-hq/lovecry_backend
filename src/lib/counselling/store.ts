import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import {
  mapAppointment,
  mapAudit,
  mapCounsellor,
  mapHold,
  mapOverride,
  mapService,
  mapSettings,
  mapSignedConsent,
  mapTemplate,
  mapWindow,
} from './mappers';
import { ensureCounsellingSeeded } from './seed';
import type {
  AppointmentAudit,
  AppointmentRecord,
  AvailabilityOverride,
  AvailabilityWindow,
  BookingSettingsRecord,
  ConsentTemplateRecord,
  CounsellorRecord,
  HoldRecord,
  IntakeAnswers,
  ServiceRecord,
  SignedConsentRecord,
} from './types';

async function ready() {
  await ensureCounsellingSeeded();
}

export async function getSettings(): Promise<BookingSettingsRecord> {
  await ready();
  const row = await prisma.bookingSettings.findUniqueOrThrow({ where: { id: 'default' } });
  return mapSettings(row);
}

export async function updateSettings(
  patch: Partial<BookingSettingsRecord>
): Promise<BookingSettingsRecord> {
  await ready();
  const row = await prisma.bookingSettings.update({
    where: { id: 'default' },
    data: {
      timeZone: patch.timeZone,
      durationMinutes: patch.durationMinutes,
      bufferBeforeMinutes: patch.bufferBeforeMinutes,
      bufferAfterMinutes: patch.bufferAfterMinutes,
      minimumNoticeHours: patch.minimumNoticeHours,
      maximumWindowDays: patch.maximumWindowDays,
      holdMinutes: patch.holdMinutes,
      consentDeadlineHours: patch.consentDeadlineHours,
      consentRequiredBeforeConfirm: patch.consentRequiredBeforeConfirm,
      googleMeetEnabled: patch.googleMeetEnabled,
      maxAppointmentsPerDay: patch.maxAppointmentsPerDay,
      inPersonLocation: patch.inPersonLocation,
      crisisMessage: patch.crisisMessage,
    },
  });
  return mapSettings(row);
}

export async function getCounsellor(): Promise<CounsellorRecord> {
  await ready();
  const row =
    (await prisma.counsellor.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })) ||
    (await prisma.counsellor.findFirstOrThrow({ orderBy: { createdAt: 'asc' } }));
  return mapCounsellor(row);
}

export async function listServices(): Promise<ServiceRecord[]> {
  await ready();
  const rows = await prisma.counsellingService.findMany({ where: { active: true } });
  return rows.map(mapService);
}

export async function getService(idOrSlug: string): Promise<ServiceRecord | undefined> {
  await ready();
  const row = await prisma.counsellingService.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], active: true },
  });
  return row ? mapService(row) : undefined;
}

export async function listWindows(): Promise<AvailabilityWindow[]> {
  await ready();
  const counsellor = await getCounsellor();
  const rows = await prisma.availabilityRule.findMany({
    where: { counsellorId: counsellor.id, active: true },
  });
  return rows.map(mapWindow);
}

export async function setWindows(windows: AvailabilityWindow[]): Promise<AvailabilityWindow[]> {
  await ready();
  const counsellor = await getCounsellor();
  await prisma.$transaction(async (tx) => {
    await tx.availabilityRule.deleteMany({ where: { counsellorId: counsellor.id } });
    if (windows.length) {
      await tx.availabilityRule.createMany({
        data: windows.map((w) => ({
          id: w.id.startsWith('w-') ? undefined : w.id,
          counsellorId: counsellor.id,
          weekday: w.weekday,
          startMinutesFromMidnight: w.startMinutes,
          endMinutesFromMidnight: w.endMinutes,
          active: w.active,
        })),
      });
    }
  });
  return listWindows();
}

export async function listOverrides(): Promise<AvailabilityOverride[]> {
  await ready();
  const counsellor = await getCounsellor();
  const rows = await prisma.availabilityOverride.findMany({
    where: { counsellorId: counsellor.id },
    orderBy: { startTimeUtc: 'asc' },
  });
  return rows.map(mapOverride);
}

export async function addOverride(o: AvailabilityOverride): Promise<void> {
  await ready();
  const counsellor = await getCounsellor();
  await prisma.availabilityOverride.create({
    data: {
      id: o.id,
      counsellorId: counsellor.id,
      startTimeUtc: new Date(o.startTimeUtc),
      endTimeUtc: new Date(o.endTimeUtc),
      type: o.type,
      reason: o.reason,
    },
  });
}

export async function deleteOverride(id: string): Promise<void> {
  await ready();
  await prisma.availabilityOverride.deleteMany({ where: { id } });
}

export async function purgeExpiredHolds(): Promise<void> {
  await prisma.appointmentHold.deleteMany({
    where: {
      convertedAt: null,
      expiresAt: { lt: new Date() },
    },
  });
}

export async function listHolds(): Promise<HoldRecord[]> {
  await ready();
  await purgeExpiredHolds();
  const rows = await prisma.appointmentHold.findMany();
  return rows.map(mapHold);
}

export async function getHoldByTokenHash(tokenHash: string): Promise<HoldRecord | undefined> {
  await ready();
  await purgeExpiredHolds();
  const row = await prisma.appointmentHold.findUnique({ where: { tokenHash } });
  return row ? mapHold(row) : undefined;
}

export async function upsertHold(hold: HoldRecord): Promise<HoldRecord> {
  await ready();
  const row = await prisma.appointmentHold.upsert({
    where: { tokenHash: hold.tokenHash },
    create: {
      id: hold.id,
      counsellorId: hold.counsellorId,
      startTimeUtc: new Date(hold.startTimeUtc),
      endTimeUtc: new Date(hold.endTimeUtc),
      tokenHash: hold.tokenHash,
      expiresAt: new Date(hold.expiresAt),
      convertedAt: hold.convertedAt ? new Date(hold.convertedAt) : null,
    },
    update: {
      startTimeUtc: new Date(hold.startTimeUtc),
      endTimeUtc: new Date(hold.endTimeUtc),
      expiresAt: new Date(hold.expiresAt),
      convertedAt: hold.convertedAt ? new Date(hold.convertedAt) : null,
    },
  });
  return mapHold(row);
}

export async function deleteHold(tokenHash: string): Promise<void> {
  await prisma.appointmentHold.deleteMany({ where: { tokenHash } });
}

export async function nextSeq(): Promise<number> {
  await ready();
  const year = new Date().getFullYear();
  const row = await prisma.appointmentSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return row.lastValue;
}

export async function upsertAppointment(a: AppointmentRecord): Promise<AppointmentRecord> {
  await ready();
  const clientData = {
    firstName: a.client.firstName,
    lastName: a.client.lastName,
    email: a.client.email,
    phone: a.client.phone,
    preferredContactMethod: a.client.preferredContactMethod,
    preferredLanguage: a.client.preferredLanguage,
    safeToLeaveVoicemail: a.client.safeToLeaveVoicemail,
    safeToSendEmail: a.client.safeToSendEmail,
    accessibilityRequirements: a.client.accessibilityRequirements,
    emergencyContactName: a.client.emergencyContactName,
    emergencyContactPhone: a.client.emergencyContactPhone,
    emergencyRelationship: a.client.emergencyRelationship,
  };

  const existingClient = a.clientId
    ? await prisma.counsellingClient.findUnique({ where: { id: a.clientId } })
    : null;
  const client = existingClient
    ? await prisma.counsellingClient.update({ where: { id: existingClient.id }, data: clientData })
    : await prisma.counsellingClient.create({ data: clientData });

  const data = {
    referenceNumber: a.referenceNumber,
    clientId: client.id,
    counsellorId: a.counsellorId,
    serviceId: a.serviceId,
    startTimeUtc: new Date(a.startTimeUtc),
    endTimeUtc: new Date(a.endTimeUtc),
    timeZone: a.timeZone,
    status: a.status,
    appointmentMode: a.appointmentMode,
    location: a.location,
    googleCalendarEventId: a.googleCalendarEventId,
    googleCalendarId: a.googleCalendarId,
    googleMeetUrl: a.googleMeetUrl,
    googleEventHtmlLink: a.googleEventHtmlLink,
    googleSyncStatus: a.googleSyncStatus,
    googleSyncError: a.googleSyncError,
    googleSyncedAt: a.googleSyncedAt ? new Date(a.googleSyncedAt) : null,
    clientNotes: a.clientNotes,
    intakeAnswers: a.intakeAnswers as Prisma.InputJsonValue,
    cancellationReason: a.cancellationReason,
    cancelledBy: a.cancelledBy,
    cancelledAt: a.cancelledAt ? new Date(a.cancelledAt) : null,
    completedAt: a.completedAt ? new Date(a.completedAt) : null,
    noShowAt: a.noShowAt ? new Date(a.noShowAt) : null,
    consentStatus: a.consentStatus,
    confirmationEmailStatus: a.confirmationEmailStatus,
    manageTokenHash: a.manageTokenHash,
    consentTokenHash: a.consentTokenHash,
    rescheduleCount: a.rescheduleCount,
    idempotencyKey: a.idempotencyKey,
  };

  const row = await prisma.appointment.upsert({
    where: { id: a.id },
    create: { id: a.id, ...data },
    update: data,
    include: { client: true },
  });
  return mapAppointment(row);
}

export async function getAppointment(id: string): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true },
  });
  return row ? mapAppointment(row) : undefined;
}

export async function updateAppointmentIntake(
  appointmentId: string,
  intakeAnswers: IntakeAnswers
): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { intakeAnswers: intakeAnswers as Prisma.InputJsonValue },
    include: { client: true },
  });
  return mapAppointment(row);
}

export async function getAppointmentByReference(ref: string): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.findUnique({
    where: { referenceNumber: ref },
    include: { client: true },
  });
  return row ? mapAppointment(row) : undefined;
}

export async function getAppointmentByManageHash(hash: string): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.findFirst({
    where: { manageTokenHash: hash },
    include: { client: true },
  });
  return row ? mapAppointment(row) : undefined;
}

export async function getAppointmentByConsentHash(hash: string): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.findFirst({
    where: { consentTokenHash: hash },
    include: { client: true },
  });
  return row ? mapAppointment(row) : undefined;
}

export async function getAppointmentByIdempotencyKey(
  key: string
): Promise<AppointmentRecord | undefined> {
  await ready();
  const row = await prisma.appointment.findUnique({
    where: { idempotencyKey: key },
    include: { client: true },
  });
  return row ? mapAppointment(row) : undefined;
}

export async function listAppointments(): Promise<AppointmentRecord[]> {
  await ready();
  const rows = await prisma.appointment.findMany({
    include: { client: true },
    orderBy: { startTimeUtc: 'asc' },
  });
  return rows.map(mapAppointment);
}

export async function addAudit(
  entry: Omit<AppointmentAudit, 'id' | 'createdAt'> & { id?: string }
): Promise<void> {
  await ready();
  const appointmentId =
    entry.appointmentId && entry.appointmentId !== 'settings' && entry.appointmentId !== 'system'
      ? entry.appointmentId
      : null;

  if (appointmentId) {
    const exists = await prisma.appointment.findUnique({ where: { id: appointmentId }, select: { id: true } });
    if (!exists) {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: 'Appointment',
          entityId: appointmentId,
          previousData: entry.previousData as Prisma.InputJsonValue,
          newData: entry.newData as Prisma.InputJsonValue,
        },
      });
      return;
    }
  }

  await prisma.appointmentAuditEvent.create({
    data: {
      id: entry.id,
      appointmentId,
      actorType: entry.actorType,
      action: entry.action,
      previousData: entry.previousData as Prisma.InputJsonValue,
      newData: entry.newData as Prisma.InputJsonValue,
    },
  });
}

export async function listAudits(limit = 50, appointmentId?: string): Promise<AppointmentAudit[]> {
  await ready();
  const rows = await prisma.appointmentAuditEvent.findMany({
    where: appointmentId ? { appointmentId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(mapAudit);
}

export async function getActiveConsentTemplate(): Promise<ConsentTemplateRecord | undefined> {
  await ready();
  const row = await prisma.consentTemplate.findFirst({ where: { status: 'ACTIVE' } });
  return row ? mapTemplate(row) : undefined;
}

export async function listConsentTemplates(): Promise<ConsentTemplateRecord[]> {
  await ready();
  const rows = await prisma.consentTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapTemplate);
}

export async function upsertConsentTemplate(t: ConsentTemplateRecord): Promise<void> {
  await ready();
  await prisma.consentTemplate.upsert({
    where: { id: t.id },
    create: {
      id: t.id,
      title: t.title,
      version: t.version,
      status: t.status,
      documentHash: t.documentHash,
      bodyText: t.bodyText,
      effectiveAt: new Date(t.effectiveAt),
      retiredAt: t.retiredAt ? new Date(t.retiredAt) : null,
    },
    update: {
      title: t.title,
      version: t.version,
      status: t.status,
      documentHash: t.documentHash,
      bodyText: t.bodyText,
      effectiveAt: new Date(t.effectiveAt),
      retiredAt: t.retiredAt ? new Date(t.retiredAt) : null,
    },
  });
}

export async function activateConsentTemplate(id: string): Promise<void> {
  await ready();
  await prisma.$transaction(async (tx) => {
    await tx.consentTemplate.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'RETIRED', retiredAt: new Date() },
    });
    await tx.consentTemplate.update({
      where: { id },
      data: { status: 'ACTIVE', retiredAt: null },
    });
  });
}

export async function upsertSignedConsent(c: SignedConsentRecord): Promise<void> {
  await ready();
  await prisma.signedConsent.upsert({
    where: { appointmentId: c.appointmentId },
    create: {
      id: c.id,
      appointmentId: c.appointmentId,
      consentTemplateId: c.consentTemplateId,
      status: c.status,
      clientLegalName: c.clientLegalName,
      clientEmail: c.clientEmail,
      signatureMethod: c.signatureMethod,
      signatureStorageKey: c.signatureStorageKey ?? (c.signatureDataUrl ? `local:${c.appointmentId}` : null),
      signingSessionId: c.signingSessionId,
      signedAtUtc: new Date(c.signedAtUtc),
      sourceIp: c.sourceIp,
      userAgent: c.userAgent,
      originalDocumentHash: c.originalDocumentHash,
      finalDocumentHash: c.finalDocumentHash,
      certificateText: c.certificateText,
      acknowledgements: c.acknowledgements as Prisma.InputJsonValue,
      artifactStatus: c.artifactStatus ?? 'LOCAL_PENDING',
      googleDriveFileId: c.googleDriveFileId,
      finalFileName: c.finalFileName,
    },
    update: {
      status: c.status,
      clientLegalName: c.clientLegalName,
      signatureMethod: c.signatureMethod,
      signedAtUtc: new Date(c.signedAtUtc),
      finalDocumentHash: c.finalDocumentHash,
      certificateText: c.certificateText,
      acknowledgements: c.acknowledgements as Prisma.InputJsonValue,
      artifactStatus: c.artifactStatus ?? 'LOCAL_PENDING',
      googleDriveFileId: c.googleDriveFileId,
      finalFileName: c.finalFileName,
    },
  });
}

export async function getSignedConsent(appointmentId: string): Promise<SignedConsentRecord | undefined> {
  await ready();
  const row = await prisma.signedConsent.findUnique({ where: { appointmentId } });
  return row ? mapSignedConsent(row) : undefined;
}

/** Transaction helper for booking critical sections. */
export { prisma };
