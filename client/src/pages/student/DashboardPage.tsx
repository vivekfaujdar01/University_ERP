import React from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function StudentDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Welcome back, {user?.name}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attendance', value: '74.2%', note: '⚠ Below 75%' },
          { label: 'Fees Due', value: '₹2,000', note: 'Due 31 Jan' },
          { label: 'CGPA', value: '8.4', note: 'Semester 5' },
          { label: 'Upcoming Exams', value: '3', note: 'Next: 20 Jan' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            <p className="text-xs text-amber-500 mt-0.5">{stat.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
