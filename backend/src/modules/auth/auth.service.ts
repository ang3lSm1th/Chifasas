import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { LoginAttempt } from '../users/entities/login-attempt.entity';
import { OpenBaoService } from '../../core/openbao/openbao.service';
import { LoginDto } from './dto/login.dto';
import { TimingSafeUtil } from '../../core/security/timing-safe.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LoginAttempt)
    private readonly attemptRepository: Repository<LoginAttempt>,
    private readonly openBaoService: OpenBaoService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string, userAgent?: string) {
    const { username, password, tenantId } = loginDto;

    // 1. REGLA ESTRICTA: Verificación de Fuerza Bruta (Máx 5 intentos en 5 min)
    await this.checkBruteForce(tenantId, username, ipAddress);

    // 2. Búsqueda de usuario dentro del tenant
    const user = await this.userRepository.findOne({
      where: { username, tenantId, isActive: true },
      relations: { role: true },
    });

    // Hash ficticio para mantener tiempo constante si el usuario no existe (Timing Attack Mitigation)
    const dummyHash = '$2b$12$e8Y5t1aK0s.gZzB5VfRz6eD1vX3K7L9mP2qW4eR6tY8uI0oP2aScG';
    const targetHash = user ? user.passwordHash : dummyHash;

    const isPasswordValid = await bcrypt.compare(password, targetHash);

    if (!user || !isPasswordValid) {
      // Registrar intento fallido
      await this.recordAttempt(tenantId, username, false, ipAddress, userAgent);
      throw new UnauthorizedException('Credenciales incorrectas'); // Mensaje genérico unificado
    }

    // Registrar intento exitoso
    await this.recordAttempt(tenantId, username, true, ipAddress, userAgent);

    // Actualizar último login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 3. Generar token de sesión firmado criptográficamente
    const secrets = await this.openBaoService.getAuthSecrets();
    const tokenPayload = {
      id: user.id,
      sub: user.id,
      username: user.username,
      fullName: user.fullName,
      tenantId: user.tenantId,
      role: user.role?.name,
      createdAt: Date.now(),
    };

    const token = this.signToken(tokenPayload, secrets.jwtKey);

    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role?.name,
        tenantId: user.tenantId,
      },
    };
  }

  async verifySessionToken(token: string): Promise<any> {
    try {
      const secrets = await this.openBaoService.getAuthSecrets();
      const [headerB64, payloadB64, signature] = token.split('.');
      if (!headerB64 || !payloadB64 || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', secrets.jwtKey)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (!TimingSafeUtil.safeEqual(signature, expectedSig)) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload && !payload.id && payload.sub) {
        payload.id = payload.sub;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private signToken(payload: any, secret: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  private async checkBruteForce(tenantId: string, username: string, ip: string) {
    const windowStart = new Date(Date.now() - 5 * 60 * 1000); // Últimos 5 minutos
    const failedAttempts = await this.attemptRepository.count({
      where: [
        { tenantId, usernameOrIp: username, successful: false, attemptedAt: MoreThan(windowStart) },
        { ipAddress: ip, successful: false, attemptedAt: MoreThan(windowStart) },
      ],
    });

    if (failedAttempts >= 5) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Demasiados intentos fallidos. Acceso bloqueado temporalmente por 5 minutos.',
          retryAfter: 300,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordAttempt(
    tenantId: string,
    username: string,
    successful: boolean,
    ip: string,
    ua?: string,
  ) {
    try {
      const attempt = this.attemptRepository.create({
        tenantId,
        usernameOrIp: username,
        successful,
        ipAddress: ip,
        userAgent: ua,
      });
      await this.attemptRepository.save(attempt);
    } catch (e: any) {
      this.logger.error(`Fallo registrando intento de login: ${e.message}`);
    }
  }
}
