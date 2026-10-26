-- Migración 004: Pedidos, Comandas de Meseras y Despacho Concurrente (Fase 4)
USE `chifa_saas`;

-- 1. Cabecera de Comandas / Pedidos (Aislamiento Multi-Tenant + Soft Delete)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NOT NULL,
  `shift_id` BIGINT NULL,
  `waiter_id` VARCHAR(36) NULL,
  `order_number` VARCHAR(30) NOT NULL,
  `order_type` VARCHAR(20) NOT NULL DEFAULT 'DINE_IN',
  `table_number` VARCHAR(50) NULL,
  `customer_name` VARCHAR(150) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_tenant_status` (`tenant_id`, `status`),
  INDEX `idx_orders_tenant_shift` (`tenant_id`, `shift_id`),
  INDEX `idx_orders_tenant_table` (`tenant_id`, `table_number`),
  CONSTRAINT `fk_orders_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_waiter` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Detalle de Ítems de Comanda con Enrutamiento a Estación KDS y Soft Delete
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `tenant_id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `kds_station_id` VARCHAR(36) NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `kds_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_items_tenant_order` (`tenant_id`, `order_id`),
  INDEX `idx_order_items_kds` (`tenant_id`, `kds_station_id`, `kds_status`),
  CONSTRAINT `fk_order_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_kds` FOREIGN KEY (`kds_station_id`) REFERENCES `kds_stations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
