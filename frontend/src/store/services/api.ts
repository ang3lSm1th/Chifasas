import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface Worker {
  id: string;
  tenantId: string;
  roleId: number;
  role?: { id: number; name: string };
  username: string;
  fullName: string;
  dni?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  rucOrTaxId?: string;
}

export const chifaApi = createApi({
  reducerPath: 'chifaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const tenantId = state.auth.tenantId;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (tenantId) {
        headers.set('x-tenant-id', tenantId);
      }
      return headers;
    },
  }),
  tagTypes: ['Workers', 'Profile', 'Tenants', 'Shift'],
  endpoints: (builder) => ({
    // Autenticación
    login: builder.mutation<
      { accessToken: string; user: any },
      { username: string; password: string; tenantId: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query<{ user: any; tenantId: string }, void>({
      query: () => '/auth/profile',
      providesTags: ['Profile'],
    }),

    // Inquilinos / Restaurantes
    getTenants: builder.query<TenantInfo[], void>({
      query: () => '/tenants',
      providesTags: ['Tenants'],
    }),

    // Trabajadores (Solo Rol ADMIN)
    getWorkers: builder.query<Worker[], void>({
      query: () => '/users',
      providesTags: ['Workers'],
    }),
    createWorker: builder.mutation<
      Worker,
      { username: string; fullName: string; password: string; roleId: number; dni?: string; phone?: string }
    >({
      query: (newWorker) => ({
        url: '/users',
        method: 'POST',
        body: newWorker,
      }),
      invalidatesTags: ['Workers'],
    }),
    toggleWorkerStatus: builder.mutation<Worker, string>({
      query: (id) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Workers'],
    }),
    deleteWorker: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workers'],
    }),

    // Turnos de Caja (Fase 2)
    getCurrentShift: builder.query<
      {
        shift: any;
        isShiftOpen: boolean;
        status: 'OPEN' | 'CLOSED';
        isInGracePeriod: boolean;
        graceExpiresAt: string | null;
        minutesRemainingInGrace: number | null;
      },
      void
    >({
      query: () => '/shifts/current',
      providesTags: ['Shift'],
    }),
    openShift: builder.mutation<
      any,
      { initialCash: number; notes?: string }
    >({
      query: (body) => ({
        url: '/shifts/open',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shift'],
    }),
    closeShift: builder.mutation<
      any,
      { declaredCash: number; notes?: string }
    >({
      query: (body) => ({
        url: '/shifts/close',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shift'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useGetTenantsQuery,
  useGetWorkersQuery,
  useCreateWorkerMutation,
  useToggleWorkerStatusMutation,
  useDeleteWorkerMutation,
  useGetCurrentShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} = chifaApi;

