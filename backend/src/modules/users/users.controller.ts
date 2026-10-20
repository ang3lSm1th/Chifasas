import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from './entities/role.entity';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleType.ADMIN) // REGLA: Exclusivo para rol ADMIN
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.usersService.findAllByTenant(tenantId);
  }

  @Post()
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    const tenantId = req.user.tenantId;
    const created = await this.usersService.create(tenantId, createUserDto);
    // Excluir hash de la respuesta
    const { passwordHash, ...safeUser } = created;
    return safeUser;
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.usersService.toggleStatus(id, tenantId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    await this.usersService.softDelete(id, tenantId);
    return { message: 'Trabajador dado de baja (borrado lógico) exitosamente.' };
  }
}
