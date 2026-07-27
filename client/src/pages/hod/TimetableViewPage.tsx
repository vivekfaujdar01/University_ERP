import React, { useState } from 'react';
import { CalendarCheck, Download, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import { useGetTimetableByDeptQuery } from '@/services/timetableApi';
import { useGetDepartmentsQuery } from '@/services/structureApi';

const currentYear = new Date().getFullYear();
const DEFAULT_YEAR = `${currentYear - 1}-${String(currentYear).slice(2)}`;

export default function HodTimetableViewPage(): React.ReactElement {
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester]         = useState(5);
  const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR);
  const [queried, setQueried]           = useState(false);

  const { data: depts } = useGetDepartmentsQuery({ limit: 100 });

  const { data: timetable, isLoading, isError } = useGetTimetableByDeptQuery(
    { departmentId, semester, academicYear },
    { skip: !queried || !departmentId }
  );

  const handlePdfDownload = () => {
    if (!timetable) return;
    window.open(
      `${import.meta.env.VITE_API_URL as string}/timetable/${timetable._id}/pdf`,
      '_blank'
    );
  };

  const inputCls =
    'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Published Timetable"
        subtitle="View the current published timetable for any department and semester"
        actions={
          timetable ? (
            <button
              type="button"
              onClick={handlePdfDownload}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Download size={15} /> Export PDF
            </button>
          ) : undefined
        }
      />

      {/* Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Filter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="view-dept" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <select
              id="view-dept"
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setQueried(false); }}
              className={`w-full ${inputCls}`}
            >
              <option value="">— Select —</option>
              {depts?.items.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="view-sem" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Semester
            </label>
            <input
              id="view-sem"
              type="number"
              min={1}
              max={12}
              value={semester}
              onChange={(e) => { setSemester(Number(e.target.value)); setQueried(false); }}
              className={`w-full ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="view-ay" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Academic Year
            </label>
            <input
              id="view-ay"
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); setQueried(false); }}
              placeholder="2024-25"
              className={`w-full ${inputCls}`}
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="button"
              disabled={!departmentId}
              onClick={() => setQueried(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
            >
              <CalendarCheck size={15} /> View Timetable
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error / Not Found */}
      {queried && !isLoading && (isError || !timetable) && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            No published timetable found for the selected filters.
          </p>
          <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">
            Generate and publish a timetable from the Generate page first.
          </p>
        </div>
      )}

      {/* Grid */}
      {timetable && !isLoading && (
        <div className="space-y-3">
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                timetable.status === 'published'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {timetable.status.toUpperCase()}
            </span>
            <span className="text-gray-500 dark:text-slate-400">{timetable.entries.length} entries</span>
            <span className="text-gray-500 dark:text-slate-400">
              Sem {timetable.semester} / {timetable.academicYear}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
            <TimetableGrid timetable={timetable} />
          </div>
        </div>
      )}
    </div>
  );
}
