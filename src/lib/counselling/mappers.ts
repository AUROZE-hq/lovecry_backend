import type {
  Appointment as PrismaAppointment,
  AvailabilityOverride as PrismaOverride,
  AvailabilityRule,
  BookingSettings,
  ConsentTemplate,
  Counsellor,
  CounsellingClient,
  CounsellingService,
  SignedConsent,
  AppointmentAuditEvent,
} from '@prisma/client';
import type {
  AppointmentAudit,
  AppointmentRecord,
  AvailabilityOverride,
  AvailabilityWindow,
  BookingSettingsRecord,
  ClientSnapshot,
  ConsentTemplateRecord,
  CounsellorRecord,
  HoldRecord,
  IntakeAnswers,
  ServiceRecord,
  SignedConsentRecord,
} from './types';

export function mapSettings(row: BookingSettings): BookingSettingsRecord {
  return {
    timeZone: row.timeZone,
    durationMinutes: row.durationMinutes,
    bufferBeforeMinutes: row.bufferBeforeMinutes,
    bufferAfterMinutes: row.bufferAfterMinutes,
    minimumNoticeHours: row.minimumNoticeHours,
    maximumWindowDays: row.maximumWindowDays,
    holdMinutes: row.holdMinutes,
    consentDeadlineHours: row.consentDeadlineHours,
    consentRequiredBeforeConfirm: row.consentRequiredBeforeConfirm,
    googleMeetEnabled: row.googleMeetEnabled,
    maxAppointmentsPerDay: row.maxAppointmentsPerDay,
    inPersonLocation: row.inPersonLocation,
    crisisMessage: row.crisisMessage,
  };
}

export function mapCounsellor(row: Counsellor): CounsellorRecord {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone ?? undefined,
    timeZone: row.timeZone,
    active: row.active,
    googleCalendarId: row.googleCalendarId ?? undefined,
  };
}

export function mapService(row: CounsellingService): ServiceRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    durationMinutes: row.durationMinutes,
    active: row.active,
  };
}

export function mapWindow(row: AvailabilityRule): AvailabilityWindow {
  return {
    id: row.id,
    weekday: row.weekday,
    startMinutes: row.startMinutesFromMidnight,
    endMinutes: row.endMinutesFromMidnight,
    active: row.active,
  };
}

export function mapOverride(row: PrismaOverride): AvailabilityOverride {
  return {
    id: row.id,
    startTimeUtc: row.startTimeUtc.toISOString(),
    endTimeUtc: row.endTimeUtc.toISOString(),
    type: row.type,
    reason: row.reason ?? undefined,
  };
}

export function mapClient(row: CounsellingClient): ClientSnapshot {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    preferredContactMethod: row.preferredContactMethod ?? undefined,
    preferredLanguage: row.preferredLanguage ?? undefined,
    safeToLeaveVoicemail: row.safeToLeaveVoicemail,
    safeToSendEmail: row.safeToSendEmail,
    accessibilityRequirements: row.accessibilityRequirements ?? undefined,
    emergencyContactName: row.emergencyContactName ?? undefined,
    emergencyContactPhone: row.emergencyContactPhone ?? undefined,
    emergencyRelationship: row.emergencyRelationship ?? undefined,
  };
}

export function mapAppointment(
  row: PrismaAppointment & { client: CounsellingClient }
): AppointmentRecord {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    clientId: row.clientId,
    counsellorId: row.counsellorId,
    serviceId: row.serviceId,
    startTimeUtc: row.startTimeUtc.toISOString(),
    endTimeUtc: row.endTimeUtc.toISOString(),
    timeZone: row.timeZone,
    status: row.status,
    appointmentMode: row.appointmentMode,
    location: row.location ?? undefined,
    googleCalendarEventId: row.googleCalendarEventId ?? undefined,
    googleCalendarId: row.googleCalendarId ?? undefined,
    googleMeetUrl: row.googleMeetUrl,
    googleEventHtmlLink: row.googleEventHtmlLink,
    googleSyncStatus: row.googleSyncStatus,
    googleSyncError: row.googleSyncError,
    googleSyncedAt: row.googleSyncedAt?.toISOString() ?? null,
    client: mapClient(row.client),
    intakeAnswers: (row.intakeAnswers as IntakeAnswers) ?? {},
    clientNotes: row.clientNotes ?? undefined,
    cancellationReason: row.cancellationReason ?? undefined,
    cancelledBy: row.cancelledBy ?? undefined,
    cancelledAt: row.cancelledAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    noShowAt: row.noShowAt?.toISOString(),
    consentStatus: row.consentStatus,
    confirmationEmailStatus: row.confirmationEmailStatus,
    manageTokenHash: row.manageTokenHash ?? '',
    consentTokenHash: row.consentTokenHash ?? undefined,
    rescheduleCount: row.rescheduleCount,
    idempotencyKey: row.idempotencyKey ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapHold(row: {
  id: string;
  counsellorId: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  tokenHash: string;
  expiresAt: Date;
  convertedAt: Date | null;
}): HoldRecord {
  return {
    id: row.id,
    counsellorId: row.counsellorId,
    startTimeUtc: row.startTimeUtc.toISOString(),
    endTimeUtc: row.endTimeUtc.toISOString(),
    tokenHash: row.tokenHash,
    rawToken: '',
    expiresAt: row.expiresAt.toISOString(),
    convertedAt: row.convertedAt?.toISOString(),
  };
}

export function mapTemplate(row: ConsentTemplate): ConsentTemplateRecord {
  return {
    id: row.id,
    title: row.title,
    version: row.version,
    status: row.status,
    documentHash: row.documentHash,
    bodyText: row.bodyText ?? '',
    effectiveAt: row.effectiveAt.toISOString(),
    retiredAt: row.retiredAt?.toISOString(),
  };
}

export function mapSignedConsent(row: SignedConsent): SignedConsentRecord {
  const acknowledgements = Array.isArray(row.acknowledgements)
    ? (row.acknowledgements as string[])
    : [];
  const artifactStatus = row.artifactStatus as SignedConsentRecord['artifactStatus'];
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    consentTemplateId: row.consentTemplateId,
    status: row.status,
    clientLegalName: row.clientLegalName,
    clientEmail: row.clientEmail,
    signatureMethod: row.signatureMethod,
    signingSessionId: row.signingSessionId,
    signedAtUtc: row.signedAtUtc.toISOString(),
    sourceIp: row.sourceIp ?? undefined,
    userAgent: row.userAgent ?? undefined,
    originalDocumentHash: row.originalDocumentHash,
    finalDocumentHash: row.finalDocumentHash,
    certificateText: row.certificateText ?? '',
    googleDriveFileId: row.googleDriveFileId ?? undefined,
    finalFileName: row.finalFileName ?? undefined,
    acknowledgements,
    artifactStatus,
  };
}

export function mapAudit(row: AppointmentAuditEvent): AppointmentAudit {
  return {
    id: row.id,
    appointmentId: row.appointmentId ?? 'system',
    actorType: row.actorType,
    action: row.action,
    previousData: row.previousData ?? undefined,
    newData: row.newData ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
