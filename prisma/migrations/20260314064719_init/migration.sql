-- CreateTable
CREATE TABLE `organisations` (
    `id` CHAR(36) NOT NULL,
    `denomination` VARCHAR(255) NOT NULL,
    `nif` VARCHAR(50) NULL,
    `nis` VARCHAR(50) NULL,
    `registre_commerce` VARCHAR(100) NULL,
    `adresse` TEXT NULL,
    `wilaya` VARCHAR(100) NULL,
    `commune` VARCHAR(100) NULL,
    `telephone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `type` ENUM('EPA', 'EPIC', 'MINISTERE', 'ENTREPRISE_PRIVEE', 'ENTREPRISE_PUBLIQUE', 'GROUPEMENT') NOT NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `organisations_denomination_idx`(`denomination`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `telephone` VARCHAR(20) NULL,
    `langue` ENUM('ar', 'fr') NOT NULL DEFAULT 'fr',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_user_id_key`(`user_id`),
    INDEX `profiles_nom_prenom_idx`(`nom`, `prenom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services_contractants` (
    `id` CHAR(36) NOT NULL,
    `organisation_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `code_service` VARCHAR(50) NOT NULL,
    `secteur_activite` VARCHAR(255) NULL,
    `ordonateur` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `services_contractants_organisation_id_idx`(`organisation_id`),
    INDEX `services_contractants_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operateurs_economiques` (
    `id` CHAR(36) NOT NULL,
    `organisation_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `qualifications` TEXT NULL,
    `categories` VARCHAR(255) NULL,
    `is_eligible` BOOLEAN NOT NULL DEFAULT false,
    `is_blacklisted` BOOLEAN NOT NULL DEFAULT false,
    `raison_blacklist` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operateurs_economiques_organisation_id_idx`(`organisation_id`),
    INDEX `operateurs_economiques_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` ENUM('ADMIN', 'SERVICE_CONTRACTANT', 'OPERATEUR_ECONOMIQUE', 'MEMBRE_COMMISSION', 'CONTROLEUR') NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_user_id_idx`(`user_id`),
    INDEX `user_roles_role_id_idx`(`role_id`),
    UNIQUE INDEX `user_roles_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `services_contractants` ADD CONSTRAINT `services_contractants_organisation_id_fkey` FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operateurs_economiques` ADD CONSTRAINT `operateurs_economiques_organisation_id_fkey` FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
