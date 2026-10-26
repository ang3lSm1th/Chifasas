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
  tagTypes: [
    'Workers',
    'Profile',
    'Tenants',
    'Shift',
    'KdsStations',
    'Categories',
    'Products',
    'Inventory',
    'Orders',
  ],
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

    // Pantallas KDS (Fase 3)
    getKdsStations: builder.query<any[], void>({
      query: () => '/kds/stations',
      providesTags: ['KdsStations'],
    }),
    getKdsStationById: builder.query<any, string>({
      query: (id) => `/kds/stations/${id}`,
      providesTags: ['KdsStations'],
    }),
    createKdsStation: builder.mutation<any, { name: string; colorHex?: string; displayOrder?: number }>({
      query: (body) => ({
        url: '/kds/stations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['KdsStations'],
    }),
    deleteKdsStation: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/kds/stations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['KdsStations'],
    }),

    // Catálogo & Carta (Fase 3)
    getCategories: builder.query<any[], void>({
      query: () => '/catalog/categories',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<any, { name: string; type?: 'FOOD' | 'BEVERAGE'; displayOrder?: number }>({
      query: (body) => ({
        url: '/catalog/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `/catalog/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),
    getProducts: builder.query<any[], { isBeverage?: boolean } | void>({
      query: (params) => {
        let url = '/catalog/products';
        if (params && params.isBeverage !== undefined) {
          url += `?isBeverage=${params.isBeverage}`;
        }
        return url;
      },
      providesTags: ['Products'],
    }),
    getFullMenu: builder.query<any[], void>({
      query: () => '/catalog/menu',
      providesTags: ['Categories', 'Products'],
    }),
    createProduct: builder.mutation<any, {
      name: string;
      categoryId: number;
      subcategoryId?: number;
      kdsStationId?: string;
      description?: string;
      price: number;
      isBeverage?: boolean;
      currentStock?: number;
      minStockAlert?: number;
    }>({
      query: (body) => ({
        url: '/catalog/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/catalog/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/catalog/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),

    // Inventario de Bebidas (Fase 3)
    getInventoryAlerts: builder.query<any[], void>({
      query: () => '/inventory/alerts',
      providesTags: ['Inventory'],
    }),
    getInventoryMovements: builder.query<any[], { productId?: string } | void>({
      query: (params) => {
        let url = '/inventory/movements';
        if (params && params.productId) {
          url += `?productId=${params.productId}`;
        }
        return url;
      },
      providesTags: ['Inventory'],
    }),
    restockProduct: builder.mutation<any, { productId: string; quantity: number; notes?: string }>({
      query: (body) => ({
        url: '/inventory/restock',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'Products'],
    }),

    // Pedidos & Comandero Web para Celulares (Fase 4)
    createOrder: builder.mutation<
      any,
      {
        orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
        tableNumber?: string;
        customerName?: string;
        notes?: string;
        items: { productId: string; quantity: number; notes?: string }[];
      }
    >({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Orders', 'Products', 'Inventory', 'Shift'],
    }),
    getOrders: builder.query<
      any[],
      { status?: string; tableNumber?: string; activeOnly?: boolean } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set('status', params.status);
        if (params?.tableNumber) queryParams.set('tableNumber', params.tableNumber);
        if (params?.activeOnly !== undefined) {
          queryParams.set('activeOnly', String(params.activeOnly));
        }
        const qs = queryParams.toString();
        return `/orders${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Orders'],
    }),
    getTablesSummary: builder.query<
      {
        tables: {
          tableNumber: string;
          state: 'FREE' | 'OCCUPIED' | 'READY_TO_SERVE';
          activeOrdersCount: number;
          accumulatedTotal: number;
          latestOrder: any;
        }[];
        activeOrdersCount: number;
      },
      void
    >({
      query: () => '/orders/tables',
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation<
      any,
      { id: string; status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED' }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
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
  useGetKdsStationsQuery,
  useGetKdsStationByIdQuery,
  useCreateKdsStationMutation,
  useDeleteKdsStationMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  useGetFullMenuQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetInventoryAlertsQuery,
  useGetInventoryMovementsQuery,
  useRestockProductMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetTablesSummaryQuery,
  useUpdateOrderStatusMutation,
} = chifaApi;
