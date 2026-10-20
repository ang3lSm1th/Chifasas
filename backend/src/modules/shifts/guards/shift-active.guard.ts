import {
  Injectable,
  CanActivate,
  ExecutionContext,
  PreconditionFailedException,
} from '@nestjs/common';
import { ShiftsService } from '../shifts.service';

@Injectable()
export class ShiftActiveGuard implements CanActivate {
  constructor(private readonly shiftsService: ShiftsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new PreconditionFailedException(
        'Operación bloqueada: No se ha especificado el restaurante (tenant_id).',
      );
    }

    const hasOpenShift = await this.shiftsService.hasOpenShift(tenantId);

    if (!hasOpenShift) {
      throw new PreconditionFailedException(
        'Operación bloqueada: La caja no tiene un turno abierto. Solicite al Administrador o Cajero la apertura de turno.',
      );
    }

    return true;
  }
}
