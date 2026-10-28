import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { DeductStockDto } from './dto/deduct-stock.dto';
import { RestockDto } from './dto/restock.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('deduct')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA)
  async deduct(@Request() req: any, @Body() dto: DeductStockDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.sub;
    return this.inventoryService.deductStock(tenantId, userId, dto);
  }

  @Post('restock')
  @Roles(RoleType.ADMIN)
  async restock(@Request() req: any, @Body() dto: RestockDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.sub;
    return this.inventoryService.restock(tenantId, userId, dto);
  }

  @Get('movements')
  @Roles(RoleType.ADMIN, RoleType.CAJERO)
  async getMovements(@Request() req: any, @Query('productId') productId?: string) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getMovements(tenantId, productId);
  }

  @Get('alerts')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA)
  async getAlerts(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getLowStockAlerts(tenantId);
  }
}
