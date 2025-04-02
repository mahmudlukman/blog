import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { userLoggedIn } from '../auth/authSlice';

export const apiSlice = createApi({
  tagTypes: ['User', 'Comment', 'Post'],
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.REACT_PUBLIC_SERVER_URI,
  }),
  endpoints: (builder) => ({
    loadUser: builder.query({
      query: () => ({
        url: 'me',
        method: 'GET',
        credentials: 'include',
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch (error) {
          console.log(error);
        }
      },
    }),
  }),
});

export const { useLoadUserQuery } = apiSlice;
