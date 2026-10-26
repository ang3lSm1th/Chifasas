import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LiveOrderNotification {
  orderId: string;
  orderNumber?: string;
  tableNumber: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
  stationName?: string;
  totalAmount?: number;
  timestamp: string;
}

interface KdsRealtimeState {
  readyAlerts: LiveOrderNotification[];
  cashierFeed: any[];
}

const initialState: KdsRealtimeState = {
  readyAlerts: [],
  cashierFeed: [],
};

const kdsSlice = createSlice({
  name: 'kds',
  initialState,
  reducers: {
    pushReadyAlert: (state, action: PayloadAction<LiveOrderNotification>) => {
      state.readyAlerts = [
        action.payload,
        ...state.readyAlerts.filter((a) => a.orderId !== action.payload.orderId),
      ].slice(0, 20);
    },
    dismissReadyAlert: (state, action: PayloadAction<string>) => {
      state.readyAlerts = state.readyAlerts.filter((a) => a.orderId !== action.payload);
    },
    pushCashierTicket: (state, action: PayloadAction<any>) => {
      state.cashierFeed = [
        action.payload,
        ...state.cashierFeed.filter((t) => t.orderId !== action.payload.orderId),
      ].slice(0, 50);
    },
  },
});

export const { pushReadyAlert, dismissReadyAlert, pushCashierTicket } = kdsSlice.actions;

export default kdsSlice.reducer;
