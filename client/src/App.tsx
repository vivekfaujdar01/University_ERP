import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages (stubs — filled in T2+)
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        richColors
        duration={4000}
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif' },
        }}
      />

      <React.Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm font-medium">Loading...</p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated routes (added in T2) */}
          {/* <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route> */}

          {/* 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;
