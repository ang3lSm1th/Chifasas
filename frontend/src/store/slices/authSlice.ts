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

      if (typeof window !== 'undefined') {
        try {
          if (action.payload.accessToken) {
            localStorage.setItem('chifa_token', action.payload.accessToken);
          }
          localStorage.setItem('chifa_user', JSON.stringify(action.payload.user));
          localStorage.setItem('chifa_tenant_id', action.payload.tenantId);
        } catch {
          // Ignore storage errors
        }
      }
    },
    hydrateAuth: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const savedToken = localStorage.getItem('chifa_token');
          const savedUserStr = localStorage.getItem('chifa_user');
          const savedTenant = localStorage.getItem('chifa_tenant_id');

          if (savedTenant) {
            state.tenantId = savedTenant;
          }
          if (savedToken && savedUserStr) {
            state.token = savedToken;
            state.user = JSON.parse(savedUserStr);
            state.isAuthenticated = true;
          }
        } catch {
          // Ignore storage errors
        }
      }
    },
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('chifa_tenant_id', action.payload);
        } catch {
          // Ignore storage errors
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('chifa_token');
          localStorage.removeItem('chifa_user');
        } catch {
          // Ignore storage errors
        }
      }
    },
  },
});

export const { setCredentials, hydrateAuth, setTenantId, logout } = authSlice.actions;
export default authSlice.reducer;
