-- Migración 002: Tabla de Turnos de Caja (Shifts) con Soft-Delete y Ventana de Gracia
USE `chifa_saas`;

CREATE TABLE IF NOT EXISTS `shifts` (
  `id` BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NOT NULL,
  `opened_by_id` VARCHAR(36) NOT NULL,
  `closed_by_id` VARCHAR(36) NULL,
  `initial_cash` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `expected_cash` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `declared_cash` DECIMAL(12, 2) NULL,
  `difference` DECIMAL(12, 2) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  `notes` TEXT NULL,
  `opened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` DATETIME NULL,
  `grace_expires_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_shifts_tenant_status` (`tenant_id`, `status`),
  INDEX `idx_shifts_opened_by` (`opened_by_id`),
  CONSTRAINT `fk_shifts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shifts_opened_by` FOREIGN KEY (`opened_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shifts_closed_by` FOREIGN KEY (`closed_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
