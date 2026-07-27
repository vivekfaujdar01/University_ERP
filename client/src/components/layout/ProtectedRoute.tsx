import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectIsAuthenticated,
  selectIsInitialised,
  selectCurrentUser,
} from '@/features/authSlice';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  /** If provided, only these roles may access the nested routes. */
  allowedRoles?: Role[];
}

/**
 * ProtectedRoute — wraps authenticated sections of the app.
 *
 * Behaviour:
 *  1. While auth state is not yet initialised (app boot), show a full-page
 *     spinner so users don't see a flash-redirect.
 *  2. If not authenticated, redirect to /login (preserving the intended path
 *     in location.state so we can redirect back after login).
 *  3. If allowedRoles is specified and the user's role isn't in the list,
 *     redirect to /403.
 *  4. Otherwise, render the child routes via <Outlet />.
 */
export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const isInitialised = useAppSelector(selectIsInitialised);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  // 1 — still booting
  if (!isInitialised) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        role="status"
        aria-label="Authenticating"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Authenticating…</p>
        </div>
      </div>
    );
  }

  // 2 — not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3 — wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // 4 — authorised
  return <Outlet />;
}
