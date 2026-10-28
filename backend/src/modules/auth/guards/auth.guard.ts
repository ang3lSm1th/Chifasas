import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticación no proporcionado');
    }

    const payload = await this.authService.verifySessionToken(token);
    if (!payload) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    // Aislamiento Multi-Tenant: Si la cabecera especificó otro tenant distinto al del token, denegar
    const headerTenantId = request.headers?.['x-tenant-id'];
    if (
      headerTenantId &&
      payload.tenantId &&
      headerTenantId !== payload.tenantId &&
      payload.role !== 'SUPER_ADMIN'
    ) {
      throw new UnauthorizedException('El token no pertenece al restaurante especificado');
    }

    payload.id = payload.id || payload.sub;
    request.tenantId = payload.tenantId;
    request.user = payload;
    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // O cookie de sesión
    return request.cookies?.chifa_session || null;
  }
}
