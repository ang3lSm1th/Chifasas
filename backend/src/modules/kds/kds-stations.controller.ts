import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { KdsStationsService } from './kds-stations.service';
import { CreateKdsStationDto } from './dto/create-kds-station.dto';
import { UpdateKdsStationDto } from './dto/update-kds-station.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';

@Controller('kds/stations')
@UseGuards(AuthGuard, RolesGuard)
export class KdsStationsController {
  constructor(private readonly kdsStationsService: KdsStationsService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  async create(@Request() req: any, @Body() dto: CreateKdsStationDto) {
    const tenantId = req.user.tenantId;
    return this.kdsStationsService.create(tenantId, dto);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findAll(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.kdsStationsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.kdsStationsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateKdsStationDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.kdsStationsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.kdsStationsService.remove(tenantId, id);
  }
}
