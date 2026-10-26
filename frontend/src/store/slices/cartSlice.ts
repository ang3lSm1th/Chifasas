import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type OrderModalType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  kdsStationId: string | null;
  kdsStationName: string | null;
  kdsStationColor: string | null;
  isBeverage: boolean;
  maxStock: number;
}

export interface CartState {
  orderType: OrderModalType;
  tableNumber: string;
  customerName: string;
  orderNotes: string;
  items: CartItem[];
}

const initialState: CartState = {
  orderType: 'DINE_IN',
  tableNumber: 'Mesa 1',
  customerName: '',
  orderNotes: '',
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setOrderType: (state, action: PayloadAction<OrderModalType>) => {
      state.orderType = action.payload;
      if (action.payload === 'TAKEAWAY') {
        state.tableNumber = 'Para Llevar';
      } else if (action.payload === 'DELIVERY') {
        state.tableNumber = 'Delivery';
      } else if (!state.tableNumber.startsWith('Mesa')) {
        state.tableNumber = 'Mesa 1';
      }
    },
    setTableNumber: (state, action: PayloadAction<string>) => {
      state.tableNumber = action.payload;
    },
    setCustomerName: (state, action: PayloadAction<string>) => {
      state.customerName = action.payload;
    },
    setOrderNotes: (state, action: PayloadAction<string>) => {
      state.orderNotes = action.payload;
    },
    addItemToCart: (
      state,
      action: PayloadAction<{
        productId: string;
        name: string;
        price: number;
        kdsStationId?: string | null;
        kdsStationName?: string | null;
        kdsStationColor?: string | null;
        isBeverage?: boolean;
        maxStock?: number;
        notes?: string;
      }>,
    ) => {
      const payload = action.payload;
      const isBev = Boolean(payload.isBeverage);
      const maxStock = isBev ? Number(payload.maxStock ?? 0) : 9999;

      if (isBev && maxStock <= 0) {
        return; // Bloqueo estricto si está agotado
      }

      const existing = state.items.find((item) => item.productId === payload.productId);
      if (existing) {
        if (isBev && existing.quantity >= maxStock) {
          return; // No exceder el stock físico disponible
        }
        existing.quantity += 1;
      } else {
        state.items.push({
          productId: payload.productId,
          name: payload.name,
          price: Number(payload.price),
          quantity: 1,
          notes: payload.notes || '',
          kdsStationId: payload.kdsStationId || null,
          kdsStationName: payload.kdsStationName || null,
          kdsStationColor: payload.kdsStationColor || null,
          isBeverage: isBev,
          maxStock,
        });
      }
    },
    decrementItemFromCart: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((item) => item.productId === action.payload);
      if (idx !== -1) {
        if (state.items[idx].quantity > 1) {
          state.items[idx].quantity -= 1;
        } else {
          state.items.splice(idx, 1);
        }
      }
    },
    removeItemFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    updateItemNotes: (
      state,
      action: PayloadAction<{ productId: string; notes: string }>,
    ) => {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        existing.notes = action.payload.notes;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.customerName = '';
      state.orderNotes = '';
    },
  },
});

export const {
  setOrderType,
  setTableNumber,
  setCustomerName,
  setOrderNotes,
  addItemToCart,
  decrementItemFromCart,
  removeItemFromCart,
  updateItemNotes,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
