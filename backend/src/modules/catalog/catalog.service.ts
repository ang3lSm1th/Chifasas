import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Category, CategoryType } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { Product } from './entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // ================= CATEGORÍAS =================
  async createCategory(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      tenantId,
      name: dto.name,
      type: dto.type || 'FOOD',
      displayOrder: dto.displayOrder ?? 0,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(tenantId: string, type?: CategoryType): Promise<Category[]> {
    const where: any = { tenantId };
    if (type) where.type = type;

    return this.categoryRepository.find({
      where,
      order: { displayOrder: 'ASC', name: 'ASC' },
      relations: { subcategories: true },
    });
  }

  async removeCategory(tenantId: string, id: number): Promise<{ success: boolean; id: number }> {
    const category = await this.categoryRepository.findOne({ where: { tenantId, id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.categoryRepository.softDelete({ id, tenantId });
    return { success: true, id };
  }

  // ================= SUBCATEGORÍAS =================
  async createSubcategory(tenantId: string, dto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoryRepository.findOne({
      where: { tenantId, id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const subcategory = this.subcategoryRepository.create({
      tenantId,
      categoryId: dto.categoryId,
      name: dto.name,
      displayOrder: dto.displayOrder ?? 0,
      isActive: true,
    });
    return this.subcategoryRepository.save(subcategory);
  }

  async findSubcategoriesByCategory(tenantId: string, categoryId: number): Promise<Subcategory[]> {
    return this.subcategoryRepository.find({
      where: { tenantId, categoryId },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  // ================= PRODUCTOS =================
  async createProduct(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { tenantId, id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría padre no encontrada');

    const product = this.productRepository.create({
      id: randomUUID(),
      tenantId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId || null,
      kdsStationId: dto.kdsStationId || null,
      name: dto.name,
      description: dto.description || null,
      price: dto.price,
      isBeverage: dto.isBeverage ?? (category.type === 'BEVERAGE'),
      currentStock: dto.currentStock ?? (category.type === 'BEVERAGE' ? 0 : 9999),
      minStockAlert: dto.minStockAlert ?? 5,
      isActive: true,
    });

    return this.productRepository.save(product);
  }

  async findAllProducts(tenantId: string, isBeverage?: boolean): Promise<Product[]> {
    const where: any = { tenantId };
    if (isBeverage !== undefined) where.isBeverage = isBeverage;

    return this.productRepository.find({
      where,
      order: { name: 'ASC' },
      relations: { category: true, subcategory: true, kdsStation: true },
    });
  }

  async findOneProduct(tenantId: string, id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { tenantId, id },
      relations: { category: true, subcategory: true, kdsStation: true },
    });
    if (!product) throw new NotFoundException(`Producto con ID '${id}' no encontrado`);
    return product;
  }

  async findFullMenu(tenantId: string) {
    const categories = await this.categoryRepository.find({
      where: { tenantId, isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
      relations: { subcategories: true },
    });

    const products = await this.productRepository.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
      relations: { kdsStation: true },
    });

    return categories.map((cat) => ({
      ...cat,
      products: products.filter((p) => p.categoryId === cat.id),
    }));
  }

  async updateProduct(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneProduct(tenantId, id);

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.subcategoryId !== undefined) product.subcategoryId = dto.subcategoryId;
    if (dto.kdsStationId !== undefined) product.kdsStationId = dto.kdsStationId;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.isBeverage !== undefined) product.isBeverage = dto.isBeverage;
    if (dto.currentStock !== undefined) product.currentStock = dto.currentStock;
    if (dto.minStockAlert !== undefined) product.minStockAlert = dto.minStockAlert;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    return this.productRepository.save(product);
  }

  async removeProduct(tenantId: string, id: string): Promise<{ success: boolean; id: string }> {
    const product = await this.findOneProduct(tenantId, id);
    await this.productRepository.softDelete({ id: product.id, tenantId });
    return { success: true, id };
  }
}
