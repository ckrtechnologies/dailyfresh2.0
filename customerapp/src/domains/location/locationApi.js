/**
 * CKR Domain: Location & Address API
 * Powered by RTK Query extending baseApi
 */

import { baseApi } from '../../shared/api/baseApi';

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query({
      query: () => '/customer/addresses',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Address', id })),
              { type: 'Address', id: 'LIST' },
            ]
          : [{ type: 'Address', id: 'LIST' }],
      transformResponse: (response) => response?.data?.addresses || response?.data || [],
    }),
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: '/customer/addresses',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),
    updateAddress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/customer/addresses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Address', id },
        { type: 'Address', id: 'LIST' },
      ],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/customer/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),
    getNearestStore: builder.query({
      query: (params) => ({
        url: '/customer/stores/nearest',
        params,
      }),
      transformResponse: (response) => response?.data?.store || null,
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetNearestStoreQuery,
} = locationApi;

export default locationApi;
