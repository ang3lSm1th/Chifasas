import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';

@Controller('shifts')
@UseGuards(AuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /**
   * Obtiene el estado actual del turno (abierto o cerrado con gracia) para el tenant del usuario
   */
  @Get('current')
  async getCurrentShift(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.shiftsService.getCurrentShift(tenantId);
  }

  /**
   * Obtiene el historial inmutable de turnos y arqueos de caja del tenant
   */
  @Get('history')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.CAJERO)
  async getShiftsHistory(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.shiftsService.getShiftsHistory(tenantId);
  }

  /**
   * Abre formalmente un turno de caja con fondo inicial
   * Restringido a Administradores y Cajeros
   */
  @Post('open')
  @Roles(RoleType.ADMIN, RoleType.CAJERO)
  async openShift(@Request() req: any, @Body() dto: OpenShiftDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.shiftsService.openShift(tenantId, userId, dto);
  }

  /**
   * Cierra el turno de caja y registra el arqueo de efectivo
   * Restringido a Administradores y Cajeros
   */
  @Post('close')
  @Roles(RoleType.ADMIN, RoleType.CAJERO)
  async closeShift(@Request() req: any, @Body() dto: CloseShiftDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.shiftsService.closeShift(tenantId, userId, dto);
  }
}
