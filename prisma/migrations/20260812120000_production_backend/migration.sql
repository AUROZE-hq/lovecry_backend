-- CreateTable
CREATE TABLE `Donor` (
    `id` VARCHAR(191) NOT NULL,
    `zeffyContactId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `addressLine1` VARCHAR(191) NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'CA',
    `anonymousPreference` BOOLEAN NOT NULL DEFAULT false,
    `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    `consentTimestamp` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Donor_zeffyContactId_key`(`zeffyContactId`),
    INDEX `Donor_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` VARCHAR(191) NOT NULL,
    `zeffyCampaignId` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `embedUrl` TEXT NULL,
    `goalAmountCents` INTEGER NULL,
    `raisedAmountCents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Campaign_zeffyCampaignId_key`(`zeffyCampaignId`),
    UNIQUE INDEX `Campaign_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donation` (
    `id` VARCHAR(191) NOT NULL,
    `localReference` VARCHAR(191) NULL,
    `zeffyTransactionId` VARCHAR(191) NULL,
    `zeffyPaymentId` VARCHAR(191) NULL,
    `donorId` VARCHAR(191) NULL,
    `campaignId` VARCHAR(191) NULL,
    `amountCents` INTEGER NOT NULL,
    `eligibleReceiptAmountCents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `frequency` ENUM('ONE_TIME', 'MONTHLY') NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL,
    `paymentProvider` VARCHAR(191) NOT NULL DEFAULT 'ZEFFY',
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `isEligibleGift` BOOLEAN NOT NULL DEFAULT true,
    `dedicationType` ENUM('NONE', 'IN_HONOUR', 'IN_MEMORY') NULL,
    `dedicationName` VARCHAR(191) NULL,
    `donorMessage` TEXT NULL,
    `transactionDate` DATETIME(3) NULL,
    `receiptRequired` BOOLEAN NOT NULL DEFAULT false,
    `receiptStatus` ENUM('NOT_REQUIRED', 'PENDING', 'GENERATED', 'EMAILED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'NOT_REQUIRED',
    `receiptId` VARCHAR(191) NULL,
    `confirmationEmailStatus` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `rawProviderMetadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Donation_localReference_key`(`localReference`),
    UNIQUE INDEX `Donation_zeffyTransactionId_key`(`zeffyTransactionId`),
    UNIQUE INDEX `Donation_zeffyPaymentId_key`(`zeffyPaymentId`),
    INDEX `Donation_donorId_idx`(`donorId`),
    INDEX `Donation_campaignId_idx`(`campaignId`),
    INDEX `Donation_status_idx`(`status`),
    INDEX `Donation_transactionDate_idx`(`transactionDate`),
    INDEX `Donation_receiptStatus_idx`(`receiptStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonationReceipt` (
    `id` VARCHAR(191) NOT NULL,
    `donationId` VARCHAR(191) NOT NULL,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `receiptType` ENUM('OFFICIAL', 'ACKNOWLEDGEMENT', 'REPLACEMENT') NOT NULL,
    `status` ENUM('NOT_REQUIRED', 'PENDING', 'GENERATED', 'EMAILED', 'CANCELLED', 'FAILED') NOT NULL,
    `issuedAt` DATETIME(3) NULL,
    `emailedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `replacementReceiptId` VARCHAR(191) NULL,
    `pdfStorageKey` VARCHAR(191) NULL,
    `checksum` VARCHAR(191) NULL,
    `donorLegalName` VARCHAR(191) NULL,
    `donorAddressSnapshot` JSON NULL,
    `charitySnapshot` JSON NULL,
    `eligibleAmountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DonationReceipt_donationId_key`(`donationId`),
    UNIQUE INDEX `DonationReceipt_receiptNumber_key`(`receiptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurringDonation` (
    `id` VARCHAR(191) NOT NULL,
    `zeffyRecurringId` VARCHAR(191) NULL,
    `donorId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `frequency` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `status` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `nextExpectedPaymentAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RecurringDonation_zeffyRecurringId_key`(`zeffyRecurringId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonationSyncEvent` (
    `id` VARCHAR(191) NOT NULL,
    `donationId` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'ZEFFY',
    `providerEventId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED') NOT NULL,
    `payloadHash` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DonationSyncEvent_providerEventId_key`(`providerEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `administratorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_administratorId_createdAt_idx`(`administratorId`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReceiptSequence` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `lastValue` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReceiptSequence_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Counsellor` (
    `id` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `googleCalendarId` VARCHAR(191) NULL,
    `googleWorkspaceUser` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'America/Toronto',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `defaultDurationMinutes` INTEGER NOT NULL DEFAULT 60,
    `bufferBeforeMinutes` INTEGER NOT NULL DEFAULT 0,
    `bufferAfterMinutes` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Counsellor_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CounsellingClient` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `preferredContactMethod` ENUM('EMAIL', 'PHONE', 'SMS') NULL,
    `preferredLanguage` VARCHAR(191) NULL,
    `safeToLeaveVoicemail` BOOLEAN NOT NULL DEFAULT false,
    `safeToSendEmail` BOOLEAN NOT NULL DEFAULT true,
    `accessibilityRequirements` TEXT NULL,
    `emergencyContactName` VARCHAR(191) NULL,
    `emergencyContactPhone` VARCHAR(191) NULL,
    `emergencyRelationship` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CounsellingClient_email_idx`(`email`),
    INDEX `CounsellingClient_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CounsellingService` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 60,
    `bufferBeforeMinutes` INTEGER NOT NULL DEFAULT 0,
    `bufferAfterMinutes` INTEGER NOT NULL DEFAULT 15,
    `appointmentMode` ENUM('VIRTUAL', 'PHONE', 'IN_PERSON') NOT NULL DEFAULT 'VIRTUAL',
    `requiresConsent` BOOLEAN NOT NULL DEFAULT true,
    `consentDeadlineHours` INTEGER NOT NULL DEFAULT 24,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CounsellingService_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `counsellorId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `startTimeUtc` DATETIME(3) NOT NULL,
    `endTimeUtc` DATETIME(3) NOT NULL,
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'America/Toronto',
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_COUNSELLOR', 'CONSENT_OVERDUE') NOT NULL DEFAULT 'PENDING',
    `appointmentMode` ENUM('VIRTUAL', 'PHONE', 'IN_PERSON') NOT NULL,
    `location` VARCHAR(191) NULL,
    `googleCalendarEventId` VARCHAR(191) NULL,
    `googleCalendarId` VARCHAR(191) NULL,
    `googleMeetUrl` VARCHAR(191) NULL,
    `googleEventHtmlLink` TEXT NULL,
    `googleSyncStatus` ENUM('NOT_SYNCED', 'PENDING', 'SYNCED', 'SYNC_FAILED', 'CANCELLED') NOT NULL DEFAULT 'NOT_SYNCED',
    `googleSyncError` TEXT NULL,
    `googleSyncedAt` DATETIME(3) NULL,
    `clientNotes` TEXT NULL,
    `intakeAnswers` JSON NULL,
    `cancellationReason` VARCHAR(191) NULL,
    `cancelledBy` ENUM('CLIENT', 'ADMIN', 'COUNSELLOR', 'SYSTEM', 'GOOGLE') NULL,
    `cancelledAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `noShowAt` DATETIME(3) NULL,
    `consentStatus` ENUM('NOT_SENT', 'SENT', 'VIEWED', 'SIGNED', 'OVERDUE', 'REVOKED') NOT NULL DEFAULT 'NOT_SENT',
    `confirmationEmailStatus` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `manageTokenHash` VARCHAR(191) NULL,
    `consentTokenHash` VARCHAR(191) NULL,
    `rescheduleCount` INTEGER NOT NULL DEFAULT 0,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Appointment_referenceNumber_key`(`referenceNumber`),
    UNIQUE INDEX `Appointment_googleCalendarEventId_key`(`googleCalendarEventId`),
    UNIQUE INDEX `Appointment_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Appointment_counsellorId_startTimeUtc_endTimeUtc_idx`(`counsellorId`, `startTimeUtc`, `endTimeUtc`),
    INDEX `Appointment_clientId_idx`(`clientId`),
    INDEX `Appointment_status_idx`(`status`),
    INDEX `Appointment_consentStatus_idx`(`consentStatus`),
    INDEX `Appointment_manageTokenHash_idx`(`manageTokenHash`),
    INDEX `Appointment_consentTokenHash_idx`(`consentTokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailabilityRule` (
    `id` VARCHAR(191) NOT NULL,
    `counsellorId` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `startMinutesFromMidnight` INTEGER NOT NULL,
    `endMinutesFromMidnight` INTEGER NOT NULL,
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveUntil` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AvailabilityRule_counsellorId_weekday_idx`(`counsellorId`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailabilityOverride` (
    `id` VARCHAR(191) NOT NULL,
    `counsellorId` VARCHAR(191) NOT NULL,
    `startTimeUtc` DATETIME(3) NOT NULL,
    `endTimeUtc` DATETIME(3) NOT NULL,
    `type` ENUM('BLOCK', 'OPEN', 'VACATION', 'HOLIDAY', 'SICK', 'EMERGENCY') NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AvailabilityOverride_counsellorId_startTimeUtc_endTimeUtc_idx`(`counsellorId`, `startTimeUtc`, `endTimeUtc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentHold` (
    `id` VARCHAR(191) NOT NULL,
    `counsellorId` VARCHAR(191) NOT NULL,
    `startTimeUtc` DATETIME(3) NOT NULL,
    `endTimeUtc` DATETIME(3) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `convertedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AppointmentHold_tokenHash_key`(`tokenHash`),
    INDEX `AppointmentHold_counsellorId_startTimeUtc_endTimeUtc_idx`(`counsellorId`, `startTimeUtc`, `endTimeUtc`),
    INDEX `AppointmentHold_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsentTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'RETIRED') NOT NULL DEFAULT 'DRAFT',
    `originalFileName` VARCHAR(191) NULL,
    `googleDriveFileId` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NULL,
    `documentHash` VARCHAR(191) NOT NULL,
    `bodyText` TEXT NULL,
    `effectiveAt` DATETIME(3) NOT NULL,
    `retiredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConsentTemplate_title_version_key`(`title`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SignedConsent` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `consentTemplateId` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_SENT', 'SENT', 'VIEWED', 'SIGNED', 'OVERDUE', 'REVOKED') NOT NULL,
    `clientLegalName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `signatureMethod` ENUM('DRAWN', 'TYPED', 'DRAWN_AND_TYPED') NOT NULL,
    `signatureStorageKey` VARCHAR(191) NULL,
    `signingSessionId` VARCHAR(191) NOT NULL,
    `signedAtUtc` DATETIME(3) NOT NULL,
    `sourceIp` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `originalDocumentHash` VARCHAR(191) NOT NULL,
    `finalDocumentHash` VARCHAR(191) NOT NULL,
    `googleDriveFileId` VARCHAR(191) NULL,
    `googleDriveFolderId` VARCHAR(191) NULL,
    `finalFileName` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `uploadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SignedConsent_appointmentId_key`(`appointmentId`),
    UNIQUE INDEX `SignedConsent_signingSessionId_key`(`signingSessionId`),
    UNIQUE INDEX `SignedConsent_finalDocumentHash_key`(`finalDocumentHash`),
    UNIQUE INDEX `SignedConsent_googleDriveFileId_key`(`googleDriveFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentReminder` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `type` ENUM('BOOKING_CONFIRMATION', 'APPOINTMENT_48H', 'APPOINTMENT_24H', 'APPOINTMENT_2H', 'CONSENT_IMMEDIATE', 'CONSENT_72H', 'CONSENT_48H', 'CONSENT_24H', 'CONSENT_DEADLINE') NOT NULL,
    `scheduledForUtc` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `providerMessageId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppointmentReminder_scheduledForUtc_status_idx`(`scheduledForUtc`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentAuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `actorType` ENUM('CLIENT', 'ADMIN', 'COUNSELLOR', 'SYSTEM', 'GOOGLE') NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppointmentAuditEvent_appointmentId_createdAt_idx`(`appointmentId`, `createdAt`),
    INDEX `AppointmentAuditEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsentAuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `signedConsentId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsentAuditEvent_signedConsentId_createdAt_idx`(`signedConsentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'America/Toronto',
    `durationMinutes` INTEGER NOT NULL DEFAULT 60,
    `bufferBeforeMinutes` INTEGER NOT NULL DEFAULT 0,
    `bufferAfterMinutes` INTEGER NOT NULL DEFAULT 15,
    `minimumNoticeHours` INTEGER NOT NULL DEFAULT 24,
    `maximumWindowDays` INTEGER NOT NULL DEFAULT 60,
    `holdMinutes` INTEGER NOT NULL DEFAULT 10,
    `consentDeadlineHours` INTEGER NOT NULL DEFAULT 24,
    `consentRequiredBeforeConfirm` BOOLEAN NOT NULL DEFAULT false,
    `googleMeetEnabled` BOOLEAN NOT NULL DEFAULT true,
    `maxAppointmentsPerDay` INTEGER NOT NULL DEFAULT 8,
    `inPersonLocation` VARCHAR(191) NOT NULL DEFAULT '93 Broadview Ave., Toronto (confirm with staff)',
    `crisisMessage` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentSequence` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `lastValue` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppointmentSequence_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'COUNSELLOR_ADMIN', 'READ_ONLY') NOT NULL DEFAULT 'ADMIN',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    INDEX `AdminUser_role_active_idx`(`role`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminSession_tokenHash_key`(`tokenHash`),
    INDEX `AdminSession_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `AdminSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleCalendarIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('GOOGLE_CALENDAR') NOT NULL DEFAULT 'GOOGLE_CALENDAR',
    `encryptedRefreshToken` TEXT NOT NULL,
    `connectedEmail` VARCHAR(191) NULL,
    `calendarId` VARCHAR(191) NULL,
    `calendarName` VARCHAR(191) NULL,
    `connectedByUserId` VARCHAR(191) NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'REVOKED', 'ERROR') NOT NULL DEFAULT 'CONNECTED',
    `lastSuccessfulCheckAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GoogleCalendarIntegration_provider_status_idx`(`provider`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleOAuthState` (
    `id` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GoogleOAuthState_state_key`(`state`),
    INDEX `GoogleOAuthState_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `Donor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonationReceipt` ADD CONSTRAINT `DonationReceipt_donationId_fkey` FOREIGN KEY (`donationId`) REFERENCES `Donation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonationSyncEvent` ADD CONSTRAINT `DonationSyncEvent_donationId_fkey` FOREIGN KEY (`donationId`) REFERENCES `Donation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_administratorId_fkey` FOREIGN KEY (`administratorId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `CounsellingClient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `Counsellor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `CounsellingService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailabilityRule` ADD CONSTRAINT `AvailabilityRule_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `Counsellor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailabilityOverride` ADD CONSTRAINT `AvailabilityOverride_counsellorId_fkey` FOREIGN KEY (`counsellorId`) REFERENCES `Counsellor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SignedConsent` ADD CONSTRAINT `SignedConsent_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SignedConsent` ADD CONSTRAINT `SignedConsent_consentTemplateId_fkey` FOREIGN KEY (`consentTemplateId`) REFERENCES `ConsentTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentReminder` ADD CONSTRAINT `AppointmentReminder_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentAuditEvent` ADD CONSTRAINT `AppointmentAuditEvent_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsentAuditEvent` ADD CONSTRAINT `ConsentAuditEvent_signedConsentId_fkey` FOREIGN KEY (`signedConsentId`) REFERENCES `SignedConsent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleCalendarIntegration` ADD CONSTRAINT `GoogleCalendarIntegration_connectedByUserId_fkey` FOREIGN KEY (`connectedByUserId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
