import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import shiftReducer from './slices/shiftSlice';
import cartReducer from './slices/cartSlice';
import kdsReducer from './slices/kdsSlice';
import { chifaApi } from './services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shift: shiftReducer,
    cart: cartReducer,
    kds: kdsReducer,
    [chifaApi.reducerPath]: chifaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chifaApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
