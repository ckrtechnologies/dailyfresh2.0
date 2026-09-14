/**
 * CKR Domain: Catalog API
 * Powered by RTK Query extending baseApi
 */

import { baseApi } from '../../shared/api/baseApi';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/customer/products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product', id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
      transformResponse: (response) => response?.data?.products || response?.data || response || [],
    }),
    getProductById: builder.query({
      query: (id) => `/customer/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
      transformResponse: (response) => response?.data?.product || response?.data || response,
    }),
    getCategories: builder.query({
      query: () => '/customer/categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
      transformResponse: (response) => response?.data?.categories || response?.data || response || [],
    }),
    getAppConfig: builder.query({
      query: () => '/app/config',
      providesTags: ['Config'],
      transformResponse: (response) => response?.data || response,
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetAppConfigQuery,
} = catalogApi;

export default catalogApi;
