import {
  createApi,
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
  type BaseQueryFn,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { setCredentials, clearCredentials, updateAccessToken } from '../features/authSlice';
import type { User } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  status: string;
  data: {
    accessToken: string;
    user: User;
  };
}

interface MeResponse {
  status: string;
  data: { user: User };
}

interface MessageResponse {
  status: string;
  data: { message: string };
}

// ─── Base query with auto-refresh interceptor ─────────────────────────────────

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL as string,
  credentials: 'include', // send httpOnly cookies on every request
  prepareHeaders(headers, { getState }) {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * baseQueryWithReauth — wraps the base query with a silent token-refresh on 401.
 * If the refresh also fails the user is logged out.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try to get a new access token via the refresh cookie
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const refreshData = refreshResult.data as AuthResponse;
      api.dispatch(updateAccessToken(refreshData.data.accessToken));
      // Retry the original request with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — force logout
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

// ─── API slice ────────────────────────────────────────────────────────────────

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          setCredentials({
            user: data.data.user,
            accessToken: data.data.accessToken,
          })
        );
      },
    }),

    logout: builder.mutation<MessageResponse, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(clearCredentials());
      },
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => '/auth/me',
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // We need the current access token from state — handled by prepareHeaders
          // Just update the user in auth state; token already set
          dispatch(
            setCredentials({
              user: data.data.user,
              // Keep existing token — getMe doesn't issue a new one
              accessToken: '',
            })
          );
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),

    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          setCredentials({
            user: data.data.user,
            accessToken: data.data.accessToken,
          })
        );
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshMutation,
} = authApi;
