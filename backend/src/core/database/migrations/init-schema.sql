-- Migración Inicial: Estructura Multi-Tenant para Tenants, Roles, Users y LoginAttempts

CREATE TABLE IF NOT EXISTS `tenants` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `ruc_or_tax_id` VARCHAR(20) NULL,
  `address` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NOT NULL,
  `role_id` INT NOT NULL,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `dni` VARCHAR(20) NULL,
  `phone` VARCHAR(30) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_tenant` (`tenant_id`),
  INDEX `idx_users_role` (`role_id`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NULL,
  `username_or_ip` VARCHAR(150) NOT NULL,
  `successful` TINYINT(1) NOT NULL,
  `ip_address` VARCHAR(64) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `attempted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_attempts_tenant_ip` (`tenant_id`, `ip_address`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeds Base: Roles e Inquilino Inicial
INSERT IGNORE INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Administrador Global del SaaS'),
(2, 'ADMIN', 'Administrador del Restaurante / Tenant'),
(3, 'CAJERO', 'Personal de Caja y Cobranza'),
(4, 'MESERA', 'Personal de Salón y Toma de Pedidos'),
(5, 'COCINERO', 'Personal de Cocina KDS');

INSERT IGNORE INTO `tenants` (`id`, `name`, `ruc_or_tax_id`, `address`, `phone`) VALUES
('chifa-mariana', 'Chifa Mariana Principal', '20123456789', 'Av. Gastronómica 123', '987654321');
