/**
 * CKR Domain: Auth API
 * Powered by RTK Query extending baseApi
 */

import { baseApi } from '../../shared/api/baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/customer/profile',
      providesTags: ['User'],
      transformResponse: (response) => response?.data?.user || response?.data || response,
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/customer/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/customer/profile',
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Cart', 'Order'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
} = authApi;

export default authApi;
