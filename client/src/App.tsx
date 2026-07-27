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

// ── Public ────────────────────────────────────────────────────────────────────
const LandingPage      = React.lazy(() => import('@/pages/LandingPage'));
const LoginPage        = React.lazy(() => import('@/pages/auth/LoginPage'));
const NotFoundPage     = React.lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage    = React.lazy(() => import('@/pages/ForbiddenPage'));

// ── Admin / Super-Admin ───────────────────────────────────────────────────────
const AdminDashboard   = React.lazy(() => import('@/pages/admin/DashboardPage'));
const DepartmentsPage  = React.lazy(() => import('@/pages/admin/DepartmentsPage'));
const ProgramsPage     = React.lazy(() => import('@/pages/admin/ProgramsPage'));
const BatchesPage      = React.lazy(() => import('@/pages/admin/BatchesPage'));
const SubjectsPage     = React.lazy(() => import('@/pages/admin/SubjectsPage'));
const RoomsPage        = React.lazy(() => import('@/pages/admin/RoomsPage'));
const TimeSlotsPage    = React.lazy(() => import('@/pages/admin/TimeSlotsPage'));
const UsersPage        = React.lazy(() => import('@/pages/admin/UsersPage'));

// ── HOD ───────────────────────────────────────────────────────────────────────
const HodDashboard          = React.lazy(() => import('@/pages/hod/DashboardPage'));
const HodTimetableGenerate  = React.lazy(() => import('@/pages/hod/TimetableGeneratePage'));
const HodTimetableView      = React.lazy(() => import('@/pages/hod/TimetableViewPage'));

// ── Faculty ───────────────────────────────────────────────────────────────────
const FacultyDashboard      = React.lazy(() => import('@/pages/faculty/DashboardPage'));
const FacultyProfile        = React.lazy(() => import('@/pages/faculty/ProfilePage'));
const FacultyTimetable      = React.lazy(() => import('@/pages/faculty/TimetablePage'));

// ── Student ───────────────────────────────────────────────────────────────────
const StudentDashboard      = React.lazy(() => import('@/pages/student/DashboardPage'));
const StudentTimetable      = React.lazy(() => import('@/pages/student/TimetablePage'));

// ── Finance ───────────────────────────────────────────────────────────────────
const FinanceDashboard = React.lazy(() => import('@/pages/finance/DashboardPage'));

// ── Suspense fallback ─────────────────────────────────────────────────────────
const Fallback = (
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
      <AuthInitialiser />
      <Toaster position="top-right" richColors duration={4000}
        toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }} />

      <React.Suspense fallback={Fallback}>
        <Routes>

          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403"   element={<ForbiddenPage />} />

          {/* ── Super Admin ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route element={<AppShell />}>
              <Route path="/admin/dashboard"   element={<AdminDashboard />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/programs"    element={<ProgramsPage />} />
              <Route path="/admin/batches"     element={<BatchesPage />} />
              <Route path="/admin/subjects"    element={<SubjectsPage />} />
              <Route path="/admin/rooms"       element={<RoomsPage />} />
              <Route path="/admin/timeslots"   element={<TimeSlotsPage />} />
              <Route path="/admin/users"       element={<UsersPage />} />
            </Route>
          </Route>

          {/* ── HOD ─────────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.HOD]} />}>
            <Route element={<AppShell />}>
              <Route path="/hod/dashboard"          element={<HodDashboard />} />
              <Route path="/hod/timetable/generate" element={<HodTimetableGenerate />} />
              <Route path="/hod/timetable/view"     element={<HodTimetableView />} />
            </Route>
          </Route>

          {/* ── Faculty ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.FACULTY, ROLES.HOD]} />}>
            <Route element={<AppShell />}>
              <Route path="/faculty/dashboard"  element={<FacultyDashboard />} />
              <Route path="/faculty/profile"    element={<FacultyProfile />} />
              <Route path="/faculty/timetable"  element={<FacultyTimetable />} />
              {/* T6 / T8 routes wired here */}
            </Route>
          </Route>

          {/* ── Student ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route element={<AppShell />}>
              <Route path="/student/dashboard"  element={<StudentDashboard />} />
              <Route path="/student/timetable"  element={<StudentTimetable />} />
              {/* T6 / T7 / T8 routes wired here */}
            </Route>
          </Route>

          {/* ── Finance Officer ──────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.FINANCE_OFFICER]} />}>
            <Route element={<AppShell />}>
              <Route path="/finance/dashboard" element={<FinanceDashboard />} />
              {/* T7 routes wired here */}
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*"    element={<Navigate to="/404" replace />} />

        </Routes>
      </React.Suspense>
    </>
  );
}

export default function App(): React.ReactElement {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
