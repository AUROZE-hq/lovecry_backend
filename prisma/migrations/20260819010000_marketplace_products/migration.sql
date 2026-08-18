-- CreateTable
CREATE TABLE `MarketplaceProduct` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `badge` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `priceCents` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `inStock` BOOLEAN NOT NULL DEFAULT true,
    `messageEyebrow` VARCHAR(191) NULL,
    `messageTitle` VARCHAR(191) NULL,
    `messageSubtitle` VARCHAR(191) NULL,
    `messageBody` TEXT NULL,
    `createdByAdminId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MarketplaceProduct_slug_key`(`slug`),
    INDEX `MarketplaceProduct_status_featured_idx`(`status`, `featured`),
    INDEX `MarketplaceProduct_createdAt_idx`(`createdAt`),
    INDEX `MarketplaceProduct_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketplaceProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `altText` VARCHAR(191) NULL,
    `role` ENUM('FRONT', 'BACK', 'GALLERY') NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `MarketplaceProductImage_productId_role_sortOrder_idx`(`productId`, `role`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketplaceProductSize` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `MarketplaceProductSize_productId_active_sortOrder_idx`(`productId`, `active`, `sortOrder`),
    UNIQUE INDEX `MarketplaceProductSize_productId_label_key`(`productId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MarketplaceProduct` ADD CONSTRAINT `MarketplaceProduct_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceProductImage` ADD CONSTRAINT `MarketplaceProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `MarketplaceProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceProductSize` ADD CONSTRAINT `MarketplaceProductSize_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `MarketplaceProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
