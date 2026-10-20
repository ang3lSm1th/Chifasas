-- =============================================================================
-- Script de Inicialización de Base de Datos - Chifa Mariana SaaS
-- Principio de Menor Privilegio (PoLP) y Protección Anti-Destrucción de BD
-- =============================================================================

-- 1. Crear Base de Datos con codificación utf8mb4
CREATE DATABASE IF NOT EXISTS `chifa_saas`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `chifa_saas`;

-- 2. Crear Usuario de Mantenimiento / Migraciones (Solo para CI/CD / Migrador)
-- Este usuario se utiliza exclusivamente al ejecutar scripts de migración controlados
CREATE USER IF NOT EXISTS 'chifa_migrator'@'%' IDENTIFIED BY 'MigratorSecurePass2026!';
GRANT CREATE, ALTER, INDEX, REFERENCES, SELECT, INSERT, UPDATE, DELETE ON `chifa_saas`.* TO 'chifa_migrator'@'%';

-- 3. Crear Usuario de Aplicación de Producción / Runtime (Principio de Menor Privilegio)
-- IMPORTANTE: Este es el usuario que usa el Backend NestJS en ejecución.
-- CERO PERMISOS DDL (DROP, TRUNCATE, ALTER, GRANT).
CREATE USER IF NOT EXISTS 'chifa_app'@'%' IDENTIFIED BY 'AppSecureRuntimePass2026!';
GRANT SELECT, INSERT, UPDATE, EXECUTE ON `chifa_saas`.* TO 'chifa_app'@'%';

-- 4. Aplicar privilegios de inmediato
FLUSH PRIVILEGES;

-- 5. Tabla de Auditoría Inmutable de Inicialización
CREATE TABLE IF NOT EXISTS `_infra_audit_init` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `action` VARCHAR(100) NOT NULL,
    `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `_infra_audit_init` (`action`, `notes`)
VALUES ('DATABASE_INITIALIZED', 'Esquema chifa_saas inicializado con políticas PoLP sin permisos DROP/TRUNCATE para chifa_app.');
