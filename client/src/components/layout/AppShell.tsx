import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * AppShell — wraps all authenticated pages.
 * Manages sidebar collapsed / mobile-open state and provides consistent layout.
 */
export default function AppShell(): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div
        className={cn(
          'flex flex-col min-h-screen sidebar-transition',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header
          onMenuClick={() => setMobileOpen((v) => !v)}
          onCollapseToggle={() => setSidebarCollapsed((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page content — padded below fixed header */}
        <main
          id="main-content"
          className="flex-1 pt-16 px-4 lg:px-6 py-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
