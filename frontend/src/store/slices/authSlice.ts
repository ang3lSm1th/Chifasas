import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  tenantId: string;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tenantId: 'chifa-mariana',
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; tenantId: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.tenantId = action.payload.tenantId;
      state.isAuthenticated = true;
    },
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setTenantId, logout } = authSlice.actions;
export default authSlice.reducer;
