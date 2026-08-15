export type AppointmentMode = 'VIRTUAL' | 'PHONE' | 'IN_PERSON';
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_BY_COUNSELLOR'
  | 'CONSENT_OVERDUE';

export type ConsentStatus = 'NOT_SENT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'OVERDUE' | 'REVOKED';
export type SignatureMethod = 'DRAWN' | 'TYPED' | 'DRAWN_AND_TYPED';
export type ContactMethod = 'EMAIL' | 'PHONE' | 'SMS';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
export type ActorType = 'CLIENT' | 'ADMIN' | 'COUNSELLOR' | 'SYSTEM' | 'GOOGLE';
export type OverrideType = 'BLOCK' | 'OPEN' | 'VACATION' | 'HOLIDAY' | 'SICK' | 'EMERGENCY';

export type AvailabilityWindow = {
  id: string;
  weekday: number; // 0=Sun … 6=Sat
  startMinutes: number;
  endMinutes: number;
  active: boolean;
};

export type AvailabilityOverride = {
  id: string;
  startTimeUtc: string;
  endTimeUtc: string;
  type: OverrideType;
  reason?: string;
};

export type CounsellorRecord = {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  timeZone: string;
  active: boolean;
  googleCalendarId?: string;
};

export type ServiceRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  active: boolean;
};

export type HoldRecord = {
  id: string;
  counsellorId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  tokenHash: string;
  rawToken: string; // only in memory for demo; production stores hash only
  expiresAt: string;
  convertedAt?: string;
};

export type ClientSnapshot = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContactMethod?: ContactMethod;
  preferredLanguage?: string;
  safeToLeaveVoicemail: boolean;
  safeToSendEmail: boolean;
  accessibilityRequirements?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRelationship?: string;
  referralSource?: string;
  firstSession?: boolean;
};

export type IntakeAnswers = Record<string, string | boolean>;

export type SignedConsentRecord = {
  id: string;
  appointmentId: string;
  consentTemplateId: string;
  status: ConsentStatus;
  clientLegalName: string;
  clientEmail: string;
  signatureMethod: SignatureMethod;
  signatureDataUrl?: string;
  signatureStorageKey?: string;
  signingSessionId: string;
  signedAtUtc: string;
  sourceIp?: string;
  userAgent?: string;
  originalDocumentHash: string;
  finalDocumentHash: string;
  certificateText: string;
  googleDriveFileId?: string;
  finalFileName?: string;
  acknowledgements: string[];
  artifactStatus?: 'LOCAL_PENDING' | 'LOCAL_STORED' | 'DRIVE_PENDING' | 'DRIVE_STORED';
};

export type AppointmentAudit = {
  id: string;
  appointmentId: string;
  actorType: ActorType;
  action: string;
  previousData?: unknown;
  newData?: unknown;
  createdAt: string;
};

export type GoogleSyncStatus =
  | 'NOT_SYNCED'
  | 'PENDING'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'CANCELLED';

export type AppointmentRecord = {
  id: string;
  referenceNumber: string;
  clientId: string;
  counsellorId: string;
  serviceId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  timeZone: string;
  status: AppointmentStatus;
  appointmentMode: AppointmentMode;
  location?: string;
  googleCalendarEventId?: string;
  googleCalendarId?: string;
  googleMeetUrl?: string | null;
  googleEventHtmlLink?: string | null;
  googleSyncStatus: GoogleSyncStatus;
  googleSyncError?: string | null;
  googleSyncedAt?: string | null;
  client: ClientSnapshot;
  intakeAnswers: IntakeAnswers;
  clientNotes?: string;
  cancellationReason?: string;
  cancelledBy?: ActorType;
  cancelledAt?: string;
  completedAt?: string;
  noShowAt?: string;
  consentStatus: ConsentStatus;
  confirmationEmailStatus: DeliveryStatus;
  manageTokenHash: string;
  consentTokenHash?: string;
  rescheduleCount: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type ConsentTemplateRecord = {
  id: string;
  title: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  documentHash: string;
  bodyText: string;
  effectiveAt: string;
  retiredAt?: string;
};

export type BookingSettingsRecord = {
  timeZone: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeHours: number;
  maximumWindowDays: number;
  holdMinutes: number;
  consentDeadlineHours: number;
  consentRequiredBeforeConfirm: boolean;
  googleMeetEnabled: boolean;
  inPersonLocation: string;
  crisisMessage: string;
  maxAppointmentsPerDay: number;
};

export type TimeSlot = {
  startTimeUtc: string;
  endTimeUtc: string;
  label: string;
};
