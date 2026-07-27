import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';
import { useLogoutMutation } from '@/services/authApi';
import { toast } from 'sonner';
import { getInitials } from '@/utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
  onCollapseToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({
  onMenuClick,
}: HeaderProps): React.ReactElement {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout().unwrap();
      void navigate('/login');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 z-20 flex items-center justify-between px-4 lg:px-6 transition-all duration-300">
      {/* Left — hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:block">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {user
              ? `${user.name} — ${user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
              : 'University ERP'}
          </h2>
        </div>
      </div>

      {/* Right — bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <button
          type="button"
          aria-label="View notifications"
          onClick={() => void navigate('/notifications')}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Bell size={20} />
          {/* Unread dot — wired up in T9 */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
            aria-hidden="true"
          />
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="avatar-menu-btn"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label="Account menu"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-gray-500 transition-transform duration-200',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              aria-labelledby="avatar-menu-btn"
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50"
            >
              {user && (
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); void navigate('/profile'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <User size={14} />
                My Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
