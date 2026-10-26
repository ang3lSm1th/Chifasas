-- Migración 005: Módulo de Cobranza POS, Comprobantes y Auditoría Financiera (Fase 5)
USE `chifa_saas`;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NOT NULL,
  `shift_id` BIGINT NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `cashier_id` VARCHAR(36) NULL,
  `receipt_number` VARCHAR(40) NOT NULL,
  `receipt_type` VARCHAR(20) NOT NULL DEFAULT 'TICKET',
  `payment_method` VARCHAR(20) NOT NULL DEFAULT 'CASH',
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `cash_received` DECIMAL(12, 2) NULL,
  `change_given` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `operation_code` VARCHAR(60) NULL,
  `customer_document` VARCHAR(25) NULL,
  `customer_name` VARCHAR(150) NULL,
  `notes` VARCHAR(255) NULL,
  `paid_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_tenant_shift` (`tenant_id`, `shift_id`),
  INDEX `idx_payments_tenant_order` (`tenant_id`, `order_id`),
  INDEX `idx_payments_tenant_paid_at` (`tenant_id`, `paid_at`),
  CONSTRAINT `fk_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
