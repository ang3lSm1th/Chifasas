# Plan de Implementación Técnica - Tarea 2: Turnos de Caja y Motor de Sesión Atada al Turno

## 1. Arquitectura de Módulos (NestJS)

```
src/modules/shifts/
├── shifts.controller.ts
├── shifts.service.ts
├── shifts.module.ts
├── entities/
│   └── shift.entity.ts              # Con tenant_id, @DeleteDateColumn(), grace_expires_at
├── dto/
│   ├── open-shift.dto.ts
│   └── close-shift.dto.ts
├── guards/
│   ├── shift-active.guard.ts         # Bloquea pedidos si turno != OPEN
│   └── shift-bound-session.guard.ts # Valida y renueva sesiones según turno
├── events/
│   ├── shift-opened.event.ts
│   └── shift-closed.event.ts
└── tasks/
    └── shift-session-cleaner.task.ts # Cron de limpieza de sesiones revocadas
```

---

## 2. Implementación del Motor de Sesión Atada al Turno

### 2.1. Lógica del `ShiftBoundSessionGuard`
```typescript
@Injectable()
export class ShiftBoundSessionGuard implements CanActivate {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly betterAuthService: BetterAuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    const session = request.session;

    if (!session) throw new UnauthorizedException('Sesión no encontrada');

    const activeShift = await this.shiftsService.findActiveOrRecentShift(tenantId);

    // Caso 1: Hay un turno OPEN -> Renovación automática Keep-Alive
    if (activeShift && activeShift.status === 'OPEN') {
      await this.betterAuthService.touchSession(session.id);
      return true;
    }

    // Caso 2: El último turno está CLOSED
    if (activeShift && activeShift.status === 'CLOSED') {
      const now = new Date();
      // Si ya pasaron las 2.5 horas de gracia post-cierre
      if (now > activeShift.graceExpiresAt) {
        await this.betterAuthService.revokeSession(session.id);
        throw new UnauthorizedException('La jornada laboral ha concluido. Inicie sesión nuevamente.');
      }
      // Dentro de la ventana de gracia de 2.5 horas
      return true;
    }

    return true; // Personal administrativo ingresando para abrir turno
  }
}
```

### 2.2. Implementación del `ShiftActiveGuard`
```typescript
@Injectable()
export class ShiftActiveGuard implements CanActivate {
  constructor(private readonly shiftsService: ShiftsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    const hasOpenShift = await this.shiftsService.hasOpenShift(tenantId);
    if (!hasOpenShift) {
      throw new PreconditionFailedException(
        'Operación bloqueada: La caja no tiene un turno abierto. Solicite al Administrador o Cajero la apertura de turno.'
      );
    }
    return true;
  }
}
```

---

## 3. Frontend Descentralizado (Next.js SPA con RTK & Executive Precision Dark)

### 3.1. Estado Global con Redux Toolkit (RTK)
- `shiftSlice`:
  - `activeShift`: ID de turno, monto inicial, timestamp de apertura, usuario responsable y estado (`OPEN` / `CLOSED`).
  - `isShiftOpen`: Booleano consumido por todos los componentes del sistema para habilitar/deshabilitar acciones operativas.
  - `graceCountdown`: Temporizador sincronizado para informar al personal el tiempo restante antes del cierre definitivo de sesión tras cerrar la caja.
- `RTK Query`: Endpoints `useGetCurrentShiftQuery`, `useOpenShiftMutation`, `useCloseShiftMutation`.

### 3.2. Diseño Visual & Feedback (Emil Kowalski)
- **Executive Precision Dark**:
  - Modal de Apertura de Turno con input numérico táctil estilizado en fuente `JetBrains Mono`.
  - Badge de Estado en Header: `#10B981` (Verde Esmeralda pulsante) cuando el turno está `OPEN`, o `#D97706` / `#EF4444` cuando está `CLOSED`.
  - Microinteracciones de presión táctil `scale(0.97)` en botones numéricos y de confirmación.
  - Alertas no invasivas con **Sonner** ante apertura o cierre de turno.

---

## 4. Loop de Rectificación para Tarea 2
1. **Orquestador Senior**: Revisa el cálculo de la ventana de gracia (`graceExpiresAt`) y transacciones atómicas.
2. **Desarrollador Backend**: Comprueba que el guard mantenga vivas las sesiones en turno abierto e invalide tokens vencida la gracia.
3. **Desarrollador Frontend**: Valida que la UI en `Executive Precision Dark` con RTK informe con precisión el estado del turno.
4. **Tester Senior**: Ejecuta pruebas de simulación temporal de caducidad de sesiones y pruebas de concurrencia en pedidos.
5. **Memoria de Errores**: Registrar cualquier lección en `Spec/memory/error-log.md` con formato condensado.
