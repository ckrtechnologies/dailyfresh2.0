/**
 * CKR Domain: Orders API
 * Powered by RTK Query extending baseApi
 */

import { baseApi } from '../../shared/api/baseApi';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params) => ({
        url: '/customer/orders',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Order', id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
      transformResponse: (response) => response?.data?.orders || response?.data || [],
    }),
    getOrderById: builder.query({
      query: (id) => `/customer/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
      transformResponse: (response) => response?.data?.order || response?.data,
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/customer/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/customer/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
} = ordersApi;

export default ordersApi;
