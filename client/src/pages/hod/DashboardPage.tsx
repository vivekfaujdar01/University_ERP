import React from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function HodDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          HOD Dashboard
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Welcome back, {user?.name}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {['Timetable', 'Attendance Reports', 'Exam Analytics'].map((item) => (
          <div
            key={item}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Coming in T3 / T5</p>
          </div>
        ))}
      </div>
    </div>
  );
}
