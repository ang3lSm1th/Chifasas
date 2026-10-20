import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftActiveGuard } from './guards/shift-active.guard';
import { ShiftBoundSessionGuard } from './guards/shift-bound-session.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shift]), AuthModule],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftActiveGuard, ShiftBoundSessionGuard],
  exports: [ShiftsService, ShiftActiveGuard, ShiftBoundSessionGuard],
})
export class ShiftsModule {}
