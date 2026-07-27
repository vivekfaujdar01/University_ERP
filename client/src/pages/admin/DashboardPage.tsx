import React from 'react';
import { Users, Building2, CreditCard, LayoutDashboard } from 'lucide-react';

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          University-wide overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students" value="1,240" icon={<Users size={20} className="text-blue-500" />} color="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Faculty" value="87" icon={<LayoutDashboard size={20} className="text-emerald-500" />} color="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard title="Departments" value="12" icon={<Building2 size={20} className="text-purple-500" />} color="bg-purple-50 dark:bg-purple-900/20" />
        <StatCard title="Pending Dues" value="₹4.2L" icon={<CreditCard size={20} className="text-amber-500" />} color="bg-amber-50 dark:bg-amber-900/20" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3 text-sm text-gray-500 dark:text-slate-400">
          <p>🟢 HOD published timetable for CSE Semester 5 — 2 min ago</p>
          <p>🔵 12 fee payments received today — ₹1.84L</p>
          <p>🟡 3 refund requests pending review</p>
          <p>🟢 Seed data loaded successfully — 5 demo users available</p>
        </div>
      </div>
    </div>
  );
}
