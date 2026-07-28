import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, User, ArrowRight, BookOpen } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function FacultyDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Welcome back, {user?.name ?? 'Faculty Member'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/faculty/timetable"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
          >
            <CalendarDays size={16} /> View My Timetable
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timetable Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-3">
              <CalendarDays size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              My Personal Schedule
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              View your personalized weekly teaching schedule and download PDF copy.
            </p>
          </div>
          <Link
            to="/faculty/timetable"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 mt-4 group"
          >
            Open Timetable <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Profile & Subject Preferences */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mb-3">
              <User size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              Subject Preferences & Profile
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Update subjects you teach and preferred time slots for automated scheduling.
            </p>
          </div>
          <Link
            to="/faculty/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-500 hover:text-purple-600 mt-4 group"
          >
            Manage Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <BookOpen size={16} className="text-blue-500" /> Teaching Overview
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Designation: <span className="font-medium text-gray-800 dark:text-slate-200 capitalize">{user?.designation ?? 'Faculty'}</span> · Department: <span className="font-medium text-gray-800 dark:text-slate-200">{user?.department ? (typeof user.department === 'object' ? user.department.name : user.department) : 'Assigned Dept'}</span>
        </p>
      </div>
    </div>
  );
}

