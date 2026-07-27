import { useEffect } from 'react';
import { useRefreshMutation } from '@/services/authApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setInitialised } from '@/features/authSlice';

/**
 * AuthInitialiser — runs once on app mount.
 * Attempts a silent token refresh using the httpOnly cookie.
 * If the refresh succeeds, Redux auth state is populated.
 * If it fails (no cookie / expired), auth state stays empty and isInitialised = true.
 * Either way, ProtectedRoute unblocks after this resolves.
 */
export default function AuthInitialiser(): null {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    void (async () => {
      try {
        await refresh().unwrap();
        // setCredentials is dispatched inside authApi.refresh.onQueryStarted
      } catch {
        // No valid session — just mark as initialised so routes can render
        dispatch(setInitialised());
      }
    })();
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
