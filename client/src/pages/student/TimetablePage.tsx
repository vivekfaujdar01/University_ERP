import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import { useGetStudentTimetableQuery } from '@/services/timetableApi';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';
import type { Batch } from '@/types';

export default function StudentTimetablePage(): React.ReactElement {
  const user = useAppSelector(selectCurrentUser);
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear - 1}-${String(currentYear).slice(2)}`;

  const { data, isLoading } = useGetStudentTimetableQuery(
    { studentId: user?._id ?? '', academicYear },
    { skip: !user }
  );

  const handlePdfDownload = (timetableId: string) => {
    window.open(
      `${import.meta.env.VITE_API_URL as string}/timetable/${timetableId}/pdf`,
      '_blank'
    );
  };

  // Get batch id from user object
  const batchId = typeof user?.batch === 'object'
    ? (user.batch as Batch)._id
    : user?.batch;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Timetable"
        subtitle={`${user?.name ?? ''} — Semester ${user?.semester ?? '—'} / ${academicYear}`}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <p className="text-gray-400 dark:text-slate-500 text-sm">No published timetable found.</p>
          <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">Contact your HOD or Admin.</p>
        </div>
      )}

      {data?.map((tt) => (
        <div key={tt._id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Semester {tt.semester}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">{tt.academicYear}</span>
            </div>
            <button
              type="button"
              onClick={() => handlePdfDownload(tt._id)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={13} /> Download PDF
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
            <TimetableGrid
              timetable={tt}
              filterBatchId={batchId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
