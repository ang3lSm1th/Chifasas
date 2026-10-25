import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KdsStation } from './entities/kds-station.entity';
import { KdsStationsService } from './kds-stations.service';
import { KdsStationsController } from './kds-stations.controller';
import { KdsGateway } from './kds.gateway';
import { OrderDispatcherService } from './order-dispatcher.service';

@Module({
  imports: [TypeOrmModule.forFeature([KdsStation])],
  controllers: [KdsStationsController],
  providers: [KdsStationsService, KdsGateway, OrderDispatcherService],
  exports: [KdsStationsService, KdsGateway, OrderDispatcherService],
})
export class KdsModule {}
