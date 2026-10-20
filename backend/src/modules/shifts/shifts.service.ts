import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Shift } from './entities/shift.entity';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ShiftOpenedEvent } from './events/shift-opened.event';
import { ShiftClosedEvent } from './events/shift-closed.event';

export interface ShiftStatusSummary {
  shift: Shift | null;
  isShiftOpen: boolean;
  status: 'OPEN' | 'CLOSED';
  isInGracePeriod: boolean;
  graceExpiresAt: Date | null;
  minutesRemainingInGrace: number | null;
}

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Abre un nuevo turno de caja formal con fondo inicial
   */
  async openShift(
    tenantId: string,
    userId: string,
    dto: OpenShiftDto,
  ): Promise<Shift> {
    const existingActive = await this.shiftRepository.findOne({
      where: { tenantId, status: 'OPEN' },
    });

    if (existingActive) {
      throw new ConflictException(
        'Ya existe un turno abierto para este restaurante. Debe cerrarlo antes de iniciar una nueva jornada.',
      );
    }

    const shift = this.shiftRepository.create({
      tenantId,
      openedById: userId,
      initialCash: Number(dto.initialCash),
      expectedCash: Number(dto.initialCash),
      status: 'OPEN',
      notes: dto.notes ?? null,
      openedAt: new Date(),
    });

    const saved = await this.shiftRepository.save(shift);

    this.logger.log(
      `[Tenant: ${tenantId}] Turno #${saved.id} ABIERTO por usuario ${userId} con fondo S/ ${saved.initialCash}`,
    );

    this.eventEmitter.emit(
      'shift.opened',
      new ShiftOpenedEvent(
        saved.id,
        tenantId,
        userId,
        saved.initialCash,
        saved.openedAt,
      ),
    );

    return saved;
  }

  /**
   * Cierra el turno de caja actual, calcula discrepancias y fija la ventana de gracia de 2.5 horas
   */
  async closeShift(
    tenantId: string,
    userId: string,
    dto: CloseShiftDto,
  ): Promise<Shift> {
    const activeShift = await this.shiftRepository.findOne({
      where: { tenantId, status: 'OPEN' },
    });

    if (!activeShift) {
      throw new NotFoundException(
        'No existe ningún turno abierto para este restaurante que se pueda cerrar.',
      );
    }

    const closedAt = new Date();
    // REGLA OPERATIVA: 150 minutos (2.5 horas) de ventana de gracia post-cierre
    const graceExpiresAt = new Date(closedAt.getTime() + 150 * 60 * 1000);
    const declaredCash = Number(dto.declaredCash);
    const difference = declaredCash - Number(activeShift.expectedCash);

    activeShift.status = 'CLOSED';
    activeShift.closedById = userId;
    activeShift.declaredCash = declaredCash;
    activeShift.difference = difference;
    activeShift.closedAt = closedAt;
    activeShift.graceExpiresAt = graceExpiresAt;

    if (dto.notes) {
      activeShift.notes = activeShift.notes
        ? `${activeShift.notes} | Arqueo: ${dto.notes}`
        : dto.notes;
    }

    const saved = await this.shiftRepository.save(activeShift);

    this.logger.log(
      `[Tenant: ${tenantId}] Turno #${saved.id} CERRADO por usuario ${userId}. Diferencia: S/ ${difference.toFixed(2)}. Gracia expira: ${graceExpiresAt.toISOString()}`,
    );

    this.eventEmitter.emit(
      'shift.closed',
      new ShiftClosedEvent(
        saved.id,
        tenantId,
        userId,
        saved.declaredCash ?? 0,
        saved.difference ?? 0,
        saved.closedAt!,
        saved.graceExpiresAt!,
      ),
    );

    return saved;
  }

  /**
   * Obtiene el estado del turno actual (abierto o cerrado con ventana de gracia)
   */
  async getCurrentShift(tenantId: string): Promise<ShiftStatusSummary> {
    const activeShift = await this.shiftRepository.findOne({
      where: { tenantId, status: 'OPEN' },
      relations: { openedBy: true },
      order: { openedAt: 'DESC' },
    });

    if (activeShift) {
      return {
        shift: activeShift,
        isShiftOpen: true,
        status: 'OPEN',
        isInGracePeriod: false,
        graceExpiresAt: null,
        minutesRemainingInGrace: null,
      };
    }

    const recentClosed = await this.shiftRepository.findOne({
      where: { tenantId, status: 'CLOSED' },
      relations: { openedBy: true, closedBy: true },
      order: { closedAt: 'DESC' },
    });

    if (!recentClosed) {
      return {
        shift: null,
        isShiftOpen: false,
        status: 'CLOSED',
        isInGracePeriod: false,
        graceExpiresAt: null,
        minutesRemainingInGrace: null,
      };
    }

    const now = Date.now();
    const graceEnd = recentClosed.graceExpiresAt
      ? new Date(recentClosed.graceExpiresAt).getTime()
      : 0;
    const isInGracePeriod = now < graceEnd;
    const minutesRemainingInGrace = isInGracePeriod
      ? Math.max(0, Math.round((graceEnd - now) / 60000))
      : 0;

    return {
      shift: recentClosed,
      isShiftOpen: false,
      status: 'CLOSED',
      isInGracePeriod,
      graceExpiresAt: recentClosed.graceExpiresAt,
      minutesRemainingInGrace,
    };
  }

  /**
   * Verifica de manera rápida si existe un turno abierto para el tenant
   */
  async hasOpenShift(tenantId: string): Promise<boolean> {
    const count = await this.shiftRepository.count({
      where: { tenantId, status: 'OPEN' },
    });
    return count > 0;
  }

  /**
   * Busca el turno activo o el más reciente cerrado
   */
  async findActiveOrRecentShift(tenantId: string): Promise<Shift | null> {
    const active = await this.shiftRepository.findOne({
      where: { tenantId, status: 'OPEN' },
    });
    if (active) return active;

    return this.shiftRepository.findOne({
      where: { tenantId, status: 'CLOSED' },
      order: { closedAt: 'DESC' },
    });
  }
}
