import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';
import { ROLES } from './types';

// Layout
import AuthInitialiser from '@/components/layout/AuthInitialiser';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// Lazy-loaded pages — public
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = React.lazy(() => import('@/pages/ForbiddenPage'));

// Lazy-loaded pages — authenticated dashboards
const AdminDashboard = React.lazy(() => import('@/pages/admin/DashboardPage'));
const HodDashboard = React.lazy(() => import('@/pages/hod/DashboardPage'));
const FacultyDashboard = React.lazy(() => import('@/pages/faculty/DashboardPage'));
const StudentDashboard = React.lazy(() => import('@/pages/student/DashboardPage'));
const FinanceDashboard = React.lazy(() => import('@/pages/finance/DashboardPage'));

const SuspenseFallback = (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm font-medium">Loading…</p>
    </div>
  </div>
);

function AppRoutes(): React.ReactElement {
  return (
    <>
      {/* Silently attempt token refresh on boot */}
      <AuthInitialiser />

      <Toaster
        position="top-right"
        richColors
        duration={4000}
        toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
      />

      <React.Suspense fallback={SuspenseFallback}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* ── Super Admin ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route element={<AppShell />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* T3+ routes added here */}
            </Route>
          </Route>

          {/* ── HOD ──────────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.HOD]} />}>
            <Route element={<AppShell />}>
              <Route path="/hod/dashboard" element={<HodDashboard />} />
            </Route>
          </Route>

          {/* ── Faculty ──────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.FACULTY]} />}>
            <Route element={<AppShell />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            </Route>
          </Route>

          {/* ── Student ──────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route element={<AppShell />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* ── Finance Officer ───────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.FINANCE_OFFICER]} />}>
            <Route element={<AppShell />}>
              <Route path="/finance/dashboard" element={<FinanceDashboard />} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </React.Suspense>
    </>
  );
}

function App(): React.ReactElement {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
