import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenBaoService } from '../openbao/openbao.service';
import { TenantContextService } from './tenant-context.service';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { LoginAttempt } from '../../modules/users/entities/login-attempt.entity';
import { Shift } from '../../modules/shifts/entities/shift.entity';
import { KdsStation } from '../../modules/kds/entities/kds-station.entity';
import { Category } from '../../modules/catalog/entities/category.entity';
import { Subcategory } from '../../modules/catalog/entities/subcategory.entity';
import { Product } from '../../modules/catalog/entities/product.entity';
import { InventoryMovement } from '../../modules/inventory/entities/inventory-movement.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { Payment } from '../../modules/billing/entities/payment.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [OpenBaoService],
      useFactory: async (baoService: OpenBaoService) => {
        const secrets = await baoService.getMySqlSecrets();
        return {
          type: 'mysql',
          host: secrets.host,
          port: secrets.port,
          username: secrets.user,
          password: secrets.pass,
          database: secrets.database,
          entities: [
            Tenant,
            User,
            Role,
            LoginAttempt,
            Shift,
            KdsStation,
            Category,
            Subcategory,
            Product,
            InventoryMovement,
            Order,
            OrderItem,
            Payment,
          ],
          // REGLA INMUTABLE: synchronize permanente en false para evitar pérdida de datos
          synchronize: false,
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),
  ],
  providers: [TenantContextService, TenantContextInterceptor],
  exports: [TenantContextService, TenantContextInterceptor],
})
export class DatabaseModule {}
