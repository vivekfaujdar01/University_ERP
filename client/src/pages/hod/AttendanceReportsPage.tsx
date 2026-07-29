import React, { useState } from 'react';
import { Download, Loader2, Users, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useGetBatchesQuery, useGetSubjectsQuery } from '@/services/structureApi';
import { useGetBatchReportQuery } from '@/services/attendanceApi';
import { usePdfDownload } from '@/hooks/usePdfDownload';

const currentYear = new Date().getFullYear();
const DEFAULT_ACADEMIC_YEAR = `${currentYear - 1}-${String(currentYear).slice(2)}`;

export default function HodAttendanceReportsPage(): React.ReactElement {
  const [batchId, setBatchId]           = useState('');
  const [subjectId, setSubjectId]       = useState('');
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR);
  const [queried, setQueried]           = useState(false);

  const { data: batches }  = useGetBatchesQuery({ limit: 100 });
  const { data: subjects } = useGetSubjectsQuery({ limit: 100 });
  const { download, downloading } = usePdfDownload();

  const { data: report, isLoading } = useGetBatchReportQuery(
    { batchId, academicYear, subjectId: subjectId || undefined },
    { skip: !queried || !batchId }
  );

  const handleExportPdf = () => {
    if (!batchId) return;
    const url = `${import.meta.env.VITE_API_URL as string}/attendance/batch/${batchId}/report/pdf?academicYear=${academicYear}`;
    void download(url, `attendance-report-batch-${batchId}.pdf`);
  };

  const inputCls =
    'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Reports"
        subtitle="View batch attendance summaries, student compliance matrix, and export PDF reports"
        actions={
          report ? (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={downloading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm shadow-blue-500/20"
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export PDF Report
            </button>
          ) : undefined
        }
      />

      {/* Filter Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-blue-500" /> Filter Report Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rep-batch" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Select Batch
            </label>
            <select
              id="rep-batch"
              value={batchId}
              onChange={(e) => { setBatchId(e.target.value); setQueried(false); }}
              className={`w-full ${inputCls}`}
            >
              <option value="">— Select Batch —</option>
              {batches?.items.map((b) => (
                <option key={b._id} value={b._id}>
                  {typeof b.program === 'object' ? b.program.name : 'Batch'} - Yr {b.year}{b.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rep-subj" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Filter by Subject (Optional)
            </label>
            <select
              id="rep-subj"
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value); setQueried(false); }}
              className={`w-full ${inputCls}`}
            >
              <option value="">All Subjects</option>
              {subjects?.items.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rep-ay" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Academic Year
            </label>
            <input
              id="rep-ay"
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); setQueried(false); }}
              className={`w-full ${inputCls}`}
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="button"
              disabled={!batchId}
              onClick={() => setQueried(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
            >
              <Users size={16} /> Fetch Attendance Report
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Report View */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Total Conducted Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{report.totalSessions}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Enrolled Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{report.totalStudents}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Defaulter Students (&lt;75%)</p>
              <p className={`text-2xl font-bold mt-1 ${report.defaulterCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {report.defaulterCount}
              </p>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 font-semibold text-sm text-gray-900 dark:text-white">
              Student Attendance Matrix
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Enrollment ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Attended / Total</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {report.studentStats.map((st, idx) => (
                    <tr
                      key={st.student._id}
                      className={st.isDefaulter ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-gray-50/50 dark:hover:bg-slate-700/30'}
                    >
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono">{st.student.enrollmentNumber ?? '—'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{st.student.name}</td>
                      <td className="py-3 px-4 text-center">{st.attendedClasses} / {st.totalClasses}</td>
                      <td className={`py-3 px-4 text-center font-bold ${st.isDefaulter ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {st.percentage}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {st.isDefaulter ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[11px] font-bold">
                            <AlertCircle size={12} /> Defaulter (&lt;75%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[11px] font-bold">
                            <CheckCircle2 size={12} /> OK (&ge;75%)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
