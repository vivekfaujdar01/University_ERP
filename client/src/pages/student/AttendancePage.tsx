import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, BookOpen, Clock, Loader2, Award } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useGetStudentSummaryQuery } from '@/services/attendanceApi';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';

const currentYear = new Date().getFullYear();
const DEFAULT_ACADEMIC_YEAR = `${currentYear - 1}-${String(currentYear).slice(2)}`;

export default function StudentAttendancePage(): React.ReactElement {
  const currentUser = useAppSelector(selectCurrentUser);
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR);

  const { data: summary, isLoading } = useGetStudentSummaryQuery(
    { studentId: currentUser?._id ?? '', academicYear },
    { skip: !currentUser }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance Summary"
        subtitle="Track subject-wise attendance percentages, lecture logs, and compliance alerts"
      />

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="stu-ay" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
            Academic Year:
          </label>
          <input
            id="stu-ay"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-32"
          />
        </div>

        {summary && (
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-slate-400">
            <span>Overall Attended: <strong className="text-gray-900 dark:text-white">{summary.attendedClasses} / {summary.totalClasses}</strong></span>
            <span>Subjects Tracked: <strong className="text-gray-900 dark:text-white">{summary.subjects.length}</strong></span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Defaulter Warning Banner (< 75%) */}
      {summary && (summary.isOverallDefaulter || summary.subjects.some((s) => s.isDefaulter)) && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 flex items-start gap-3 text-red-800 dark:text-red-300 shadow-sm">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold">⚠️ Attendance Threshold Alert (&lt; 75%)</h3>
            <p className="text-xs mt-1 text-red-700 dark:text-red-400 leading-relaxed">
              Your attendance in one or more subjects is below the mandatory <strong>75% minimum threshold</strong>.
              Failure to maintain 75% attendance may result in exam hall ticket blockage. Please contact your subject instructor or HOD.
            </p>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Overall Attendance</p>
              <p className={`text-3xl font-extrabold mt-1 ${summary.overallPercentage < 75 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {summary.overallPercentage}%
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Required Minimum: 75%</p>
            </div>
            <div className={`p-3 rounded-xl ${summary.overallPercentage < 75 ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-green-50 dark:bg-green-900/30 text-green-500'}`}>
              <Award size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Classes Attended</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                {summary.attendedClasses}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Out of {summary.totalClasses} total conducted</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Status Compliance</p>
              <p className="text-xl font-bold mt-1">
                {summary.isOverallDefaulter ? (
                  <span className="text-red-600 dark:text-red-400">Critical (&lt;75%)</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">Good (&ge;75%)</span>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Current Academic Term</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500">
              <Clock size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Subject-Wise Breakdown Cards */}
      {summary && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500" /> Subject-Wise Breakdown
          </h2>

          {summary.subjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center text-xs text-gray-400">
              No attendance records found for this academic year.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.subjects.map((sub) => (
                <div
                  key={sub.subject._id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        {sub.subject.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        Code: {sub.subject.code} {sub.subject.isLab ? '· Lab' : ''}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        sub.isDefaulter
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          sub.isDefaulter ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Attended {sub.attendedClasses} of {sub.totalClasses} classes</span>
                      <span>Target: 75%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
