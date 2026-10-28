'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { hydrateAuth, setCredentials } from './slices/authSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());

    const state = store.getState();
    if (!state.auth.isAuthenticated) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      fetch(`${apiUrl}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            store.dispatch(
              setCredentials({
                user: data.user,
                accessToken: localStorage.getItem('chifa_token') || '',
                tenantId: data.tenantId || data.user.tenantId || 'chifa-mariana',
              }),
            );
          }
        })
        .catch(() => {
          // Ignore if no active cookie session
        });
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
