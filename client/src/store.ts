import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import { authApi } from './services/authApi';
import { structureApi } from './services/structureApi';
import { timetableApi } from './services/timetableApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [structureApi.reducerPath]: structureApi.reducer,
    [timetableApi.reducerPath]: timetableApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(structureApi.middleware)
      .concat(timetableApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
