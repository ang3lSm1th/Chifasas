import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdateOrderItemStatusDto } from './dto/update-order-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';
import { ShiftActiveGuard } from '../shifts/guards/shift-active.guard';
import { ShiftBoundSessionGuard } from '../shifts/guards/shift-bound-session.guard';

@Controller('orders')
@UseGuards(AuthGuard, ShiftBoundSessionGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Crea y despacha una comanda desde el Comandero Web de Celulares o POS.
   * Protegido por ShiftActiveGuard: retorna 412 Precondition Failed si la caja está cerrada.
   */
  @Post()
  @UseGuards(ShiftActiveGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA)
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    const tenantId = req.user.tenantId;
    return this.ordersService.createOrder(tenantId, req.user, dto);
  }

  /**
   * Lista las comandas del restaurante autenticado.
   */
  @Get()
  async findAllOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('tableNumber') tableNumber?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.ordersService.findAllOrders(tenantId, {
      status,
      tableNumber,
      activeOnly: activeOnly === 'true',
    });
  }

  /**
   * Obtiene el mapa/resumen de mesas del salón y sus órdenes activas.
   */
  @Get('tables')
  async getTablesSummary(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.ordersService.getTablesSummary(tenantId);
  }

  /**
   * Obtiene el detalle de una comanda por su ID.
   */
  @Get(':id')
  async findOneOrder(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.ordersService.findOneOrder(tenantId, id);
  }

  /**
   * Actualiza el estado de una comanda (ej. PREPARING, READY, SERVED, CANCELLED).
   */
  @Patch(':id/status')
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.ordersService.updateOrderStatus(tenantId, id, dto.status);
  }

  /**
   * Actualiza el estado de preparación KDS de un ítem individual.
   */
  @Patch(':id/items/:itemId/status')
  async updateOrderItemStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.ordersService.updateOrderItemStatus(tenantId, id, itemId, dto.kdsStatus);
  }
}
