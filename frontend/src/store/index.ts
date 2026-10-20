import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { chifaApi } from './services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [chifaApi.reducerPath]: chifaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chifaApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
