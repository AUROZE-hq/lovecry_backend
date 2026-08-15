-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `eventCategory` VARCHAR(191) NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Toronto',
    `locationType` ENUM('IN_PERSON', 'ONLINE', 'HYBRID') NOT NULL,
    `venueName` VARCHAR(191) NULL,
    `addressLine` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `onlinePlatform` VARCHAR(191) NULL,
    `onlineUrl` TEXT NULL,
    `coverImageUrl` TEXT NULL,
    `coverImageAlt` VARCHAR(191) NULL,
    `registrationType` ENUM('LEARN_MORE', 'EXTERNAL_REGISTRATION', 'INTERNAL_REGISTRATION', 'NO_REGISTRATION') NOT NULL DEFAULT 'LEARN_MORE',
    `registrationUrl` TEXT NULL,
    `registrationDeadline` DATETIME(3) NULL,
    `capacity` INTEGER NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `impactSummary` TEXT NULL,
    `attendeesCount` INTEGER NULL,
    `volunteersCount` INTEGER NULL,
    `volunteerHours` INTEGER NULL,
    `activitiesCount` INTEGER NULL,
    `peopleReached` INTEGER NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByAdminId` VARCHAR(191) NULL,
    `updatedByAdminId` VARCHAR(191) NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_status_startDateTime_idx`(`status`, `startDateTime`),
    INDEX `Event_startDateTime_idx`(`startDateTime`),
    INDEX `Event_publishedAt_idx`(`publishedAt`),
    INDEX `Event_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventHighlight` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `EventHighlight_eventId_sortOrder_idx`(`eventId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventMedia` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `altText` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `EventMedia_eventId_sortOrder_idx`(`eventId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` ENUM('REGISTERED', 'CANCELLED', 'WAITLISTED') NOT NULL DEFAULT 'REGISTERED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventRegistration_eventId_status_idx`(`eventId`, `status`),
    INDEX `EventRegistration_email_idx`(`email`),
    UNIQUE INDEX `EventRegistration_eventId_email_key`(`eventId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_updatedByAdminId_fkey` FOREIGN KEY (`updatedByAdminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventHighlight` ADD CONSTRAINT `EventHighlight_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventMedia` ADD CONSTRAINT `EventMedia_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration` ADD CONSTRAINT `EventRegistration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
