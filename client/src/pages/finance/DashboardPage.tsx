import React from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

export default function FinanceDashboardPage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Welcome back, {user?.name}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Collected', value: '₹48.2L' },
          { label: 'Pending', value: '₹12.4L' },
          { label: 'Overdue', value: '₹3.1L' },
          { label: 'Refunds', value: '7' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
