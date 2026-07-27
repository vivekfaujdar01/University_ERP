import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  CheckSquare,
  CreditCard,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  X,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';
import { useLogoutMutation } from '@/services/authApi';
import { toast } from 'sonner';
import type { Role } from '@/types';

// ─── Nav structure per role ───────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  children?: Omit<NavItem, 'icon' | 'children'>[];
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    {
      label: 'Users & Structure',
      to: '/admin/users',
      icon: <Users size={18} />,
      children: [
        { label: 'Users', to: '/admin/users' },
        { label: 'Departments', to: '/admin/departments' },
        { label: 'Programs & Batches', to: '/admin/programs' },
        { label: 'Subjects', to: '/admin/subjects' },
        { label: 'Rooms & Slots', to: '/admin/rooms' },
      ],
    },
    { label: 'Timetable', to: '/admin/timetable', icon: <CalendarDays size={18} /> },
    { label: 'Analytics', to: '/admin/analytics', icon: <FileText size={18} /> },
    { label: 'Settings', to: '/admin/settings', icon: <Settings size={18} /> },
  ],
  hod: [
    { label: 'Dashboard', to: '/hod/dashboard', icon: <LayoutDashboard size={18} /> },
    {
      label: 'Timetable',
      to: '/hod/timetable',
      icon: <CalendarDays size={18} />,
      children: [
        { label: 'Generate', to: '/hod/timetable/generate' },
        { label: 'View Published', to: '/hod/timetable/view' },
      ],
    },
    {
      label: 'Attendance',
      to: '/hod/attendance',
      icon: <CheckSquare size={18} />,
      children: [
        { label: 'Reports', to: '/hod/attendance/reports' },
        { label: 'Defaulters', to: '/hod/attendance/defaulters' },
      ],
    },
    {
      label: 'Exams',
      to: '/hod/exams',
      icon: <FileText size={18} />,
      children: [
        { label: 'Schedule', to: '/hod/exams/schedule' },
        { label: 'Results', to: '/hod/exams/results' },
        { label: 'Analytics', to: '/hod/exams/analytics' },
      ],
    },
    { label: 'Faculty Mgmt', to: '/hod/faculty', icon: <Users size={18} /> },
  ],
  faculty: [
    { label: 'Dashboard', to: '/faculty/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Timetable', to: '/faculty/timetable', icon: <CalendarDays size={18} /> },
    { label: 'Mark Attendance', to: '/faculty/attendance', icon: <CheckSquare size={18} /> },
    { label: 'Mark Entry', to: '/faculty/marks', icon: <FileText size={18} /> },
  ],
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Timetable', to: '/student/timetable', icon: <CalendarDays size={18} /> },
    { label: 'Attendance', to: '/student/attendance', icon: <CheckSquare size={18} /> },
    {
      label: 'Fees',
      to: '/student/fees',
      icon: <CreditCard size={18} />,
      children: [
        { label: 'Pay Fees', to: '/student/fees/pay' },
        { label: 'Payment History', to: '/student/fees/history' },
      ],
    },
    {
      label: 'Exams',
      to: '/student/exams',
      icon: <BookOpen size={18} />,
      children: [
        { label: 'Hall Ticket', to: '/student/exams/hall-ticket' },
        { label: 'Results', to: '/student/exams/results' },
      ],
    },
  ],
  finance_officer: [
    { label: 'Dashboard', to: '/finance/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Fee Structures', to: '/finance/structures', icon: <Settings size={18} /> },
    { label: 'Student Fees', to: '/finance/fees', icon: <Users size={18} /> },
    {
      label: 'Payments',
      to: '/finance/payments',
      icon: <CreditCard size={18} />,
      children: [
        { label: 'Record Cash', to: '/finance/payments/cash' },
        { label: 'Refunds', to: '/finance/payments/refunds' },
      ],
    },
    { label: 'Scholarships', to: '/finance/scholarships', icon: <GraduationCap size={18} /> },
    { label: 'Analytics', to: '/finance/analytics', icon: <FileText size={18} /> },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NavGroupProps {
  item: NavItem;
  collapsed: boolean;
}

function NavGroup({ item, collapsed }: NavGroupProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-primary/10 text-primary border-r-2 border-primary -mr-0.5'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
          )
        }
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? item.label : undefined}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
          'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              size={14}
              className={cn('transition-transform duration-200', open && 'rotate-180')}
            />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-9 mt-0.5 space-y-0.5 border-l border-gray-200 dark:border-slate-700 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  'block py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-200'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: SidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();

  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      void navigate('/login');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-slate-700',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <span className="text-white font-bold text-sm" aria-hidden="true">U</span>
        </div>
        {!collapsed && (
          <span className="text-gray-900 dark:text-white font-semibold text-sm truncate">
            University ERP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavGroup key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Notifications shortcut */}
      <div className="px-3 pb-2">
        <NavLink
          to="/notifications"
          title={collapsed ? 'Notifications' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
            )
          }
        >
          <Bell size={18} className="shrink-0" />
          {!collapsed && <span>Notifications</span>}
        </NavLink>
      </div>

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-200 dark:border-slate-700">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 truncate capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleLogout()}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 sidebar-transition z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50 sidebar-transition',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
            className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
