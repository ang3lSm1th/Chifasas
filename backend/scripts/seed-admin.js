const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function main() {
  console.log('--- Creando / Actualizando usuario Admin (admin / admin) ---');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'RootSecureSuperAdminPass2026!',
    database: process.env.DB_NAME || 'chifa_saas',
  });

  try {
    const username = 'admin';
    const plainPassword = 'admin';
    const tenantId = 'chifa-mariana';
    const roleId = 2; // ADMIN

    // 1. Asegurar que el tenant exista
    await connection.execute(
      `INSERT IGNORE INTO tenants (id, name, ruc_or_tax_id, address, phone, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [tenantId, 'Chifa Mariana Principal', '20123456789', 'Av. Gastronómica 123', '987654321']
    );

    // 2. Generar hash de bcrypt
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const userId = crypto.randomUUID();

    // 3. Verificar si el usuario ya existe
    const [rows] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ? AND tenant_id = ?',
      [username, tenantId]
    );

    if (rows.length > 0) {
      await connection.execute(
        `UPDATE users 
         SET password_hash = ?, role_id = ?, is_active = 1, full_name = 'Administrador General'
         WHERE username = ? AND tenant_id = ?`,
        [passwordHash, roleId, username, tenantId]
      );
      console.log(`[OK] Usuario '${username}' actualizado exitosamente con la contraseña '${plainPassword}'.`);
    } else {
      await connection.execute(
        `INSERT INTO users (id, tenant_id, role_id, username, full_name, dni, phone, password_hash, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          userId,
          tenantId,
          roleId,
          username,
          'Administrador General',
          '00000000',
          '999999999',
          passwordHash,
        ]
      );
      console.log(`[OK] Usuario '${username}' creado exitosamente con la contraseña '${plainPassword}'. ID: ${userId}`);
    }

    // 4. Limpiar intentos fallidos previos en login_attempts para evitar rate limit (429)
    await connection.execute(
      'DELETE FROM login_attempts WHERE username_or_ip = ? OR tenant_id = ?',
      [username, tenantId]
    );
    console.log('[OK] Registro de intentos de login reseteado para permitir acceso inmediato.');

  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
