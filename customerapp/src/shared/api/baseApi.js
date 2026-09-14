/**
 * CKR House Standard RTK Query Base API
 * Mirrors Section 4.1 of CKR Mobile Standards.
 * Handles automated token injection, base URL routing, and cache tag types.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ENV } from '../../config/env';
import storage from '../../utils/storage';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: ENV.API_BASE_URL,
    prepareHeaders: async (headers, { getState }) => {
      // 1. First priority: Redux state auth token
      const stateToken = getState()?.auth?.token;
      let token = stateToken;

      // 2. Fallback: local storage
      if (!token) {
        token = await storage.getItem('access_token');
      }

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Product',
    'Category',
    'Cart',
    'Order',
    'Address',
    'Favorite',
    'Config',
  ],
  endpoints: () => ({}),
});

export default baseApi;
