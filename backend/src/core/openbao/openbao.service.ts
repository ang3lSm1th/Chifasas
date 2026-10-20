import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MySqlSecrets {
  host: string;
  port: number;
  database: string;
  user: string;
  pass: string;
}

export interface AuthSecrets {
  authKey: string;
  jwtKey: string;
  sessionName: string;
}

@Injectable()
export class OpenBaoService {
  private readonly logger = new Logger(OpenBaoService.name);
  private readonly baoAddr = process.env.OPENBAO_ADDR || 'http://localhost:8200';
  private readonly baoToken = process.env.OPENBAO_TOKEN || 'chifa_dev_root_token_2026';

  // Fallback seguro en memoria para desarrollo local si el daemon de OpenBao no está activo
  private memorySecrets: { mysql: MySqlSecrets; auth: AuthSecrets } = {
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'chifa_saas',
      user: process.env.DB_USER || 'chifa_app',
      pass: process.env.DB_PASS || 'AppSecureRuntimePass2026!',
    },
    auth: {
      authKey: process.env.AUTH_SECRET || 'chifa_better_auth_dev_secret_key_2026',
      jwtKey: process.env.JWT_SECRET || 'chifa_jwt_dev_signing_key_executive_dark_2026',
      sessionName: 'chifa_session',
    },
  };

  async getMySqlSecrets(): Promise<MySqlSecrets> {
    try {
      const response = await axios.get(`${this.baoAddr}/v1/secret/data/chifa/mysql`, {
        headers: { 'X-Vault-Token': this.baoToken },
        timeout: 1500,
      });
      const data = response.data?.data?.data;
      if (data) {
        this.logger.log('Secretos de MySQL obtenidos dinámicamente desde OpenBao.');
        return {
          host: data.host || this.memorySecrets.mysql.host,
          port: Number(data.port) || this.memorySecrets.mysql.port,
          database: data.database || this.memorySecrets.mysql.database,
          user: data.user || this.memorySecrets.mysql.user,
          pass: data.pass || data.password || this.memorySecrets.mysql.pass,
        };
      }
    } catch (err: any) {
      this.logger.warn(`OpenBao no disponible (${err.message}). Utilizando proveedor de secretos local en memoria.`);
    }
    return this.memorySecrets.mysql;
  }

  async getAuthSecrets(): Promise<AuthSecrets> {
    try {
      const response = await axios.get(`${this.baoAddr}/v1/secret/data/chifa/better-auth`, {
        headers: { 'X-Vault-Token': this.baoToken },
        timeout: 1500,
      });
      const data = response.data?.data?.data;
      if (data) {
        this.logger.log('Secretos de Better Auth obtenidos dinámicamente desde OpenBao.');
        return {
          authKey: data.auth_key || data.better_auth_secret || this.memorySecrets.auth.authKey,
          jwtKey: data.jwt_key || data.jwt_signing_key || this.memorySecrets.auth.jwtKey,
          sessionName: data.session_name || 'chifa_session',
        };
      }
    } catch (err: any) {
      this.logger.warn(`OpenBao no disponible (${err.message}). Utilizando proveedor de secretos local en memoria.`);
    }
    return this.memorySecrets.auth;
  }
}
