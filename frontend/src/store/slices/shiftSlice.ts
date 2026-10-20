import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ShiftData {
  id: string;
  tenantId: string;
  openedById: string;
  closedById?: string | null;
  initialCash: number;
  expectedCash: number;
  declaredCash?: number | null;
  difference?: number | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  graceExpiresAt?: string | null;
  openedBy?: { id: string; fullName: string; username: string };
  closedBy?: { id: string; fullName: string; username: string };
}

export interface ShiftState {
  activeShift: ShiftData | null;
  isShiftOpen: boolean;
  isInGracePeriod: boolean;
  graceExpiresAt: string | null;
  minutesRemainingInGrace: number | null;
}

const initialState: ShiftState = {
  activeShift: null,
  isShiftOpen: false,
  isInGracePeriod: false,
  graceExpiresAt: null,
  minutesRemainingInGrace: null,
};

export const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    setShiftStatus: (
      state,
      action: PayloadAction<{
        shift: ShiftData | null;
        isShiftOpen: boolean;
        isInGracePeriod?: boolean;
        graceExpiresAt?: string | null;
        minutesRemainingInGrace?: number | null;
      }>,
    ) => {
      state.activeShift = action.payload.shift;
      state.isShiftOpen = action.payload.isShiftOpen;
      state.isInGracePeriod = action.payload.isInGracePeriod ?? false;
      state.graceExpiresAt = action.payload.graceExpiresAt ?? null;
      state.minutesRemainingInGrace = action.payload.minutesRemainingInGrace ?? null;
    },
    resetShift: (state) => {
      state.activeShift = null;
      state.isShiftOpen = false;
      state.isInGracePeriod = false;
      state.graceExpiresAt = null;
      state.minutesRemainingInGrace = null;
    },
  },
});

export const { setShiftStatus, resetShift } = shiftSlice.actions;
export default shiftSlice.reducer;
