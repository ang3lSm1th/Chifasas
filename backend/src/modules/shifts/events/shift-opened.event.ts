export class ShiftOpenedEvent {
  constructor(
    public readonly shiftId: string,
    public readonly tenantId: string,
    public readonly openedById: string,
    public readonly initialCash: number,
    public readonly openedAt: Date,
  ) {}
}
