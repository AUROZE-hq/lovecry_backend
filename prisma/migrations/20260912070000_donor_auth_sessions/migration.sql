-- Donor portal authentication + donation idempotency + recurring relations

ALTER TABLE `Donor`
  ADD COLUMN `passwordHash` VARCHAR(191) NULL,
  ADD COLUMN `portalActivatedAt` DATETIME(3) NULL;

CREATE TABLE `DonorSession` (
  `id` VARCHAR(191) NOT NULL,
  `donorId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `DonorSession_tokenHash_key`(`tokenHash`),
  INDEX `DonorSession_donorId_expiresAt_idx`(`donorId`, `expiresAt`),
  INDEX `DonorSession_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DonorSession`
  ADD CONSTRAINT `DonorSession_donorId_fkey`
  FOREIGN KEY (`donorId`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `DonorAuthToken` (
  `id` VARCHAR(191) NOT NULL,
  `donorId` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `purpose` ENUM('ACTIVATION', 'MAGIC_LINK', 'PASSWORD_RESET') NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `donationId` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `DonorAuthToken_tokenHash_key`(`tokenHash`),
  INDEX `DonorAuthToken_email_purpose_idx`(`email`, `purpose`),
  INDEX `DonorAuthToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DonorAuthToken`
  ADD CONSTRAINT `DonorAuthToken_donorId_fkey`
  FOREIGN KEY (`donorId`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Donation`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Donation_idempotencyKey_key` ON `Donation`(`idempotencyKey`);

ALTER TABLE `RecurringDonation`
  ADD COLUMN `paymentMethodMasked` VARCHAR(191) NULL;

CREATE INDEX `RecurringDonation_donorId_status_idx` ON `RecurringDonation`(`donorId`, `status`);

ALTER TABLE `RecurringDonation`
  ADD CONSTRAINT `RecurringDonation_donorId_fkey`
  FOREIGN KEY (`donorId`) REFERENCES `Donor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RecurringDonation`
  ADD CONSTRAINT `RecurringDonation_campaignId_fkey`
  FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
