/**
 * CKR Domain: Cart API
 * Powered by RTK Query extending baseApi
 */

import { baseApi } from '../../shared/api/baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/customer/cart',
      providesTags: ['Cart'],
      transformResponse: (response) => response?.data || [],
    }),
    syncCart: builder.mutation({
      query: (items) => ({
        url: '/customer/cart/sync',
        method: 'POST',
        body: { items },
      }),
      invalidatesTags: ['Cart'],
    }),
    validateCoupon: builder.mutation({
      query: (body) => ({
        url: '/customer/coupons/validate',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCartQuery,
  useSyncCartMutation,
  useValidateCouponMutation,
} = cartApi;

export default cartApi;
