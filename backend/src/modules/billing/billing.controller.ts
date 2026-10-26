import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';
import { ShiftActiveGuard } from '../shifts/guards/shift-active.guard';
import { ShiftBoundSessionGuard } from '../shifts/guards/shift-bound-session.guard';

@Controller('billing')
@UseGuards(AuthGuard, ShiftBoundSessionGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Procesa el cobro de una comanda en Efectivo, Yape, Plin o Tarjeta.
   * Protegido por ShiftActiveGuard y exclusivo para CAJERO / ADMIN.
   */
  @Post('pay')
  @UseGuards(ShiftActiveGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.CAJERO)
  async processPayment(@Request() req: any, @Body() dto: CreatePaymentDto) {
    const tenantId = req.user.tenantId;
    return this.billingService.processPayment(tenantId, req.user, dto);
  }

  /**
   * Obtiene la Pre-Cuenta detallada de una orden para verificación antes del cobro.
   */
  @Get('prebill/:orderId')
  async getPreBill(@Request() req: any, @Param('orderId') orderId: string) {
    const tenantId = req.user.tenantId;
    return this.billingService.getPreBill(tenantId, orderId);
  }

  /**
   * Lista el historial de cobros y comprobantes emitidos.
   */
  @Get('payments')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.CAJERO)
  async getPayments(@Request() req: any, @Query('shiftId') shiftId?: string) {
    const tenantId = req.user.tenantId;
    return this.billingService.getPaymentsHistory(tenantId, shiftId);
  }

  /**
   * Reporte integral de Auditoría Financiera, Ventas por Producto y Arqueos.
   */
  @Get('audit')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.CAJERO)
  async getFinancialAudit(
    @Request() req: any,
    @Query('shiftId') shiftId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.billingService.getFinancialAuditReport(tenantId, {
      shiftId,
      startDate,
      endDate,
    });
  }
}
