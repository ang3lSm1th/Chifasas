import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ShiftsService } from '../shifts.service';

@Injectable()
export class ShiftBoundSessionGuard implements CanActivate {
  constructor(private readonly shiftsService: ShiftsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    // Si no hay tenant o es una ruta pública, permitir que continúe
    if (!tenantId) {
      return true;
    }

    const shiftSummary = await this.shiftsService.getCurrentShift(tenantId);

    // Caso 1: Turno abierto -> Sesión garantizada de forma indefinida durante el servicio
    if (shiftSummary.isShiftOpen) {
      return true;
    }

    // Caso 2: El último turno está cerrado
    if (shiftSummary.shift && shiftSummary.shift.status === 'CLOSED') {
      const now = Date.now();
      const graceExpiresAt = shiftSummary.shift.graceExpiresAt
        ? new Date(shiftSummary.shift.graceExpiresAt).getTime()
        : 0;

      // Si se superó la ventana de gracia de 2.5 horas post-cierre
      if (now > graceExpiresAt) {
        throw new UnauthorizedException(
          'El turno anterior ha finalizado y la ventana de gracia ha expirado. Inicie sesión nuevamente para la nueva jornada laboral.',
        );
      }

      // Dentro de la ventana de gracia de 2.5 horas post-cierre
      return true;
    }

    // Caso 3: Restaurante nuevo sin turnos creados (ej. primer inicio de admin)
    return true;
  }
}
