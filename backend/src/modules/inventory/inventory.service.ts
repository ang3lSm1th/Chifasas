import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { DeductStockDto } from './dto/deduct-stock.dto';
import { RestockDto } from './dto/restock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Descuenta stock de manera atómica con bloqueo a nivel de fila y transacción.
   * Si el stock es insuficiente o el producto está agotado, lanza BadRequestException.
   */
  async deductStock(tenantId: string, userId: string | null, dto: DeductStockDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID '${dto.productId}' no encontrado en el tenant`);
      }

      if (!product.isBeverage) {
        // Los platos de comida no tienen control de inventario finito estricto
        await queryRunner.commitTransaction();
        return { success: true, productId: product.id, currentStock: product.currentStock };
      }

      if (product.currentStock < dto.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para '${product.name}'. Solicitado: ${dto.quantity}, Disponible: ${product.currentStock}`,
        );
      }

      const previousStock = product.currentStock;
      const newStock = previousStock - dto.quantity;

      // Actualización atómica
      await queryRunner.manager.update(
        Product,
        { id: product.id, tenantId },
        { currentStock: newStock },
      );

      // Registro de movimiento histórico
      const movement = queryRunner.manager.create(InventoryMovement, {
        tenantId,
        productId: product.id,
        userId,
        type: 'SALE',
        quantity: dto.quantity,
        previousStock,
        newStock,
        notes: dto.notes || 'Venta de comanda',
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      return {
        success: true,
        productId: product.id,
        productName: product.name,
        previousStock,
        newStock,
        isLowStock: newStock <= product.minStockAlert,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registra ingreso de mercadería y aumenta el stock de la bebida.
   */
  async restock(tenantId: string, userId: string | null, dto: RestockDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID '${dto.productId}' no encontrado`);
      }

      const previousStock = product.currentStock;
      const newStock = previousStock + dto.quantity;

      await queryRunner.manager.update(
        Product,
        { id: product.id, tenantId },
        { currentStock: newStock },
      );

      const movement = queryRunner.manager.create(InventoryMovement, {
        tenantId,
        productId: product.id,
        userId,
        type: 'RESTOCK',
        quantity: dto.quantity,
        previousStock,
        newStock,
        notes: dto.notes || 'Ingreso de mercadería',
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      return {
        success: true,
        productId: product.id,
        productName: product.name,
        previousStock,
        newStock,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lista historial de movimientos de inventario por tenant
   */
  async getMovements(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;

    return this.movementRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { product: true, user: true },
      take: 100,
    });
  }

  /**
   * Lista alertas de stock bajo para bebidas
   */
  async getLowStockAlerts(tenantId: string) {
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_beverage = 1')
      .andWhere('p.is_active = 1')
      .andWhere('p.current_stock <= p.min_stock_alert')
      .orderBy('p.current_stock', 'ASC')
      .getMany();
  }
}
