import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Wand2, Users, FileText, ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function HodDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HOD Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Welcome back, {user?.name ?? 'Department Head'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/hod/timetable/generate"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
          >
            <Wand2 size={16} /> Generate Timetable
          </Link>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timetable Generator */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-3">
              <Wand2 size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              Timetable Generator
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Auto-generate conflict-free schedules using DSA engine with manual overrides.
            </p>
          </div>
          <Link
            to="/hod/timetable/generate"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 mt-4 group"
          >
            Open Generator <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* View Timetables */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-3">
              <CalendarDays size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              View Department Schedules
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Inspect draft and published timetables, check conflicts, and export PDF.
            </p>
          </div>
          <Link
            to="/hod/timetable/view"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-600 mt-4 group"
          >
            View Timetables <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Faculty Management */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              Faculty Workload
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              View department faculty assignments, workload limits, and preferred slots.
            </p>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 mt-4">
            Managed via Admin structure & Faculty Profiles
          </span>
        </div>
      </div>

      {/* Module Overview Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText size={16} className="text-blue-500" /> System Modules Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-800 dark:text-slate-200 block">Timetable Engine (T4/T5)</span>
            <span className="text-green-600 dark:text-green-400 font-medium">✅ Active & Ready</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-800 dark:text-slate-200 block">Attendance Tracker (T6)</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">⏸ Planned Next</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700">
            <span className="font-medium text-gray-800 dark:text-slate-200 block">Exam & Results (T8)</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">⏸ Planned Next</span>
          </div>
        </div>
      </div>
    </div>
  );
}

