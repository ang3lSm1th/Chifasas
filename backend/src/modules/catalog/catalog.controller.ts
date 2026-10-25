import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../users/entities/role.entity';
import { CategoryType } from './entities/category.entity';

@Controller('catalog')
@UseGuards(AuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ================= CARTA COMPLETA (COMANDERO / SALÓN) =================
  @Get('menu')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async getFullMenu(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.catalogService.findFullMenu(tenantId);
  }

  // ================= CATEGORÍAS =================
  @Post('categories')
  @Roles(RoleType.ADMIN)
  async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    const tenantId = req.user.tenantId;
    return this.catalogService.createCategory(tenantId, dto);
  }

  @Get('categories')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findAllCategories(@Request() req: any, @Query('type') type?: CategoryType) {
    const tenantId = req.user.tenantId;
    return this.catalogService.findAllCategories(tenantId, type);
  }

  @Delete('categories/:id')
  @Roles(RoleType.ADMIN)
  async removeCategory(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.catalogService.removeCategory(tenantId, parseInt(id, 10));
  }

  // ================= SUBCATEGORÍAS =================
  @Post('subcategories')
  @Roles(RoleType.ADMIN)
  async createSubcategory(@Request() req: any, @Body() dto: CreateSubcategoryDto) {
    const tenantId = req.user.tenantId;
    return this.catalogService.createSubcategory(tenantId, dto);
  }

  @Get('subcategories')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findSubcategories(@Request() req: any, @Query('categoryId') categoryId: string) {
    const tenantId = req.user.tenantId;
    return this.catalogService.findSubcategoriesByCategory(tenantId, parseInt(categoryId, 10));
  }

  // ================= PRODUCTOS =================
  @Post('products')
  @Roles(RoleType.ADMIN)
  async createProduct(@Request() req: any, @Body() dto: CreateProductDto) {
    const tenantId = req.user.tenantId;
    return this.catalogService.createProduct(tenantId, dto);
  }

  @Get('products')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findAllProducts(@Request() req: any, @Query('isBeverage') isBeverage?: string) {
    const tenantId = req.user.tenantId;
    const isBev = isBeverage !== undefined ? isBeverage === 'true' : undefined;
    return this.catalogService.findAllProducts(tenantId, isBev);
  }

  @Get('products/:id')
  @Roles(RoleType.ADMIN, RoleType.CAJERO, RoleType.MESERA, RoleType.COCINERO)
  async findOneProduct(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.catalogService.findOneProduct(tenantId, id);
  }

  @Patch('products/:id')
  @Roles(RoleType.ADMIN)
  async updateProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.catalogService.updateProduct(tenantId, id, dto);
  }

  @Delete('products/:id')
  @Roles(RoleType.ADMIN)
  async removeProduct(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.catalogService.removeProduct(tenantId, id);
  }
}
