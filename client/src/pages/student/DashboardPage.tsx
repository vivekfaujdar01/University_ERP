import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function StudentDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Welcome back, {user?.name ?? 'Student'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/student/timetable"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
          >
            <CalendarDays size={16} /> View My Timetable
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Semester', value: `Sem ${user?.semester ?? 5}`, note: 'Active' },
          { label: 'CGPA', value: user?.cgpa ? String(user.cgpa) : '8.4', note: 'Cumulative' },
          { label: 'Enrollment', value: user?.enrollmentNumber ?? 'CS21001', note: 'Student ID' },
          { label: 'Timetable Status', value: 'Published', note: 'Spring 2024-25' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            <p className="text-xs text-blue-500 mt-0.5">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Timetable Link Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 shrink-0">
            <CalendarDays size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              My Class Schedule & Timetable
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Access your batch schedule for current semester with subject codes, rooms, and instructor details.
            </p>
          </div>
        </div>
        <Link
          to="/student/timetable"
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          View Timetable <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

