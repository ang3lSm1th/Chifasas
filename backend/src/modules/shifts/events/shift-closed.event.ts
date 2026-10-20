export class ShiftClosedEvent {
  constructor(
    public readonly shiftId: string,
    public readonly tenantId: string,
    public readonly closedById: string,
    public readonly declaredCash: number,
    public readonly difference: number,
    public readonly closedAt: Date,
    public readonly graceExpiresAt: Date,
  ) {}
}
