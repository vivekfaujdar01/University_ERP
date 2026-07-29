import React, { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useGetBatchesQuery } from '@/services/structureApi';
import { useGetDefaultersQuery, useNotifyDefaultersMutation } from '@/services/attendanceApi';

const currentYear = new Date().getFullYear();
const DEFAULT_ACADEMIC_YEAR = `${currentYear - 1}-${String(currentYear).slice(2)}`;

export default function HodDefaultersPage(): React.ReactElement {
  const [batchId, setBatchId]           = useState('');
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR);

  const { data: batches } = useGetBatchesQuery({ limit: 100 });

  const { data: defaulters, isLoading } = useGetDefaultersQuery({
    academicYear,
    batchId: batchId || undefined,
  });

  const [notifyDefaulters, { isLoading: sendingNotifs }] = useNotifyDefaultersMutation();

  const handleSendWarnings = async () => {
    try {
      const res = await notifyDefaulters({ academicYear }).unwrap();
      toast.success(
        `Warning emails sent to ${res.emailsSent} defaulter student(s).`
      );
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to send warning emails.');
    }
  };

  const inputCls =
    'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Defaulters (&lt; 75%)"
        subtitle="Identify and notify students falling below mandatory attendance requirements"
        actions={
          defaulters && defaulters.length > 0 ? (
            <button
              type="button"
              onClick={handleSendWarnings}
              disabled={sendingNotifs}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm shadow-red-500/20"
            >
              {sendingNotifs ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              Send Warning Emails ({defaulters.length})
            </button>
          ) : undefined
        }
      />

      {/* Filter Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="def-batch" className="text-xs font-medium text-gray-700 dark:text-slate-300 mr-2">
              Filter Batch:
            </label>
            <select
              id="def-batch"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className={inputCls}
            >
              <option value="">All Batches</option>
              {batches?.items.map((b) => (
                <option key={b._id} value={b._id}>
                  {typeof b.program === 'object' ? b.program.name : 'Batch'} - Yr {b.year}{b.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="def-ay" className="text-xs font-medium text-gray-700 dark:text-slate-300 mr-2">
              Academic Year:
            </label>
            <input
              id="def-ay"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
          </div>
        </div>

        {defaulters && (
          <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">
            Total Defaulters: <span className="text-red-600 dark:text-red-400 text-sm font-bold">{defaulters.length}</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Defaulters Table */}
      {defaulters && !isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {defaulters.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-green-500" />
              <p className="font-semibold text-sm text-gray-700 dark:text-slate-200">No Defaulters Found!</p>
              <p>All students maintain &ge;75% attendance for this selection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Enrollment ID</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4 text-center">Attended / Total</th>
                    <th className="py-3 px-4 text-center">Overall %</th>
                    <th className="py-3 px-4">Critical Subjects (&lt;75%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {defaulters.map((item, idx) => (
                    <tr key={item.student._id} className="hover:bg-red-50/40 dark:hover:bg-red-950/20">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {item.student.name}
                      </td>
                      <td className="py-3 px-4 font-mono">{item.student.enrollmentNumber ?? '—'}</td>
                      <td className="py-3 px-4">
                        {item.student.batch
                          ? `Yr ${item.student.batch.year}${item.student.batch.section}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {item.attendedClasses} / {item.totalClasses}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-red-600 dark:text-red-400">
                        {item.overallPercentage}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.criticalSubjects.length > 0 ? (
                            item.criticalSubjects.map((code) => (
                              <span
                                key={code}
                                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
