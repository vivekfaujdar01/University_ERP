import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  UserCheck,
  Calendar,
  Sparkles,
  Info,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import {
  useGetBatchesQuery,
  useGetSubjectsQuery,
  useGetUsersQuery,
} from '@/services/structureApi';
import { useGetFacultyTimetableQuery, useGetTimetableByDeptQuery } from '@/services/timetableApi';
import {
  useMarkAttendanceMutation,
  useGetFacultyMarkedSessionsQuery,
} from '@/services/attendanceApi';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';
import type { User, TimeSlot, TimetableDoc } from '@/types';

const TODAY = new Date().toISOString().split('T')[0]!;
const currentYear = new Date().getFullYear();
const DEFAULT_ACADEMIC_YEAR = `${currentYear - 1}-${String(currentYear).slice(2)}`;
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface StudentRecord {
  student: User;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export default function FacultyMarkAttendancePage(): React.ReactElement {
  const currentUser = useAppSelector(selectCurrentUser);

  const [date, setDate]             = useState(TODAY);
  const [batchId, setBatchId]       = useState('');
  const [subjectId, setSubjectId]   = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [academicYear]              = useState(DEFAULT_ACADEMIC_YEAR);

  const [records, setRecords]       = useState<StudentRecord[]>([]);

  const { data: batches }  = useGetBatchesQuery({ limit: 100 });
  const { data: subjects } = useGetSubjectsQuery({ limit: 100 });

  // 1. Query Faculty Personal Published Timetable
  const { data: facultyTimetables, isLoading: loadingTimetable } = useGetFacultyTimetableQuery(
    { facultyId: currentUser?._id ?? '', academicYear },
    { skip: !currentUser?._id }
  );

  // Derive department ID from selected batch for backup timetable query
  const selectedBatchObj = batches?.items.find((b) => b._id === batchId);
  const deptId = selectedBatchObj?.program
    ? typeof selectedBatchObj.program === 'object'
      ? typeof selectedBatchObj.program.department === 'object'
        ? selectedBatchObj.program.department._id
        : selectedBatchObj.program.department
      : ''
    : currentUser?.department
      ? typeof currentUser.department === 'object'
        ? currentUser.department._id
        : currentUser.department
      : '';

  // Derive semester from the already-loaded faculty timetables if available,
  // otherwise fall back to the logged-in user's own semester field.
  const derivedSemester: number = (() => {
    if (facultyTimetables && facultyTimetables.length > 0) {
      return facultyTimetables[0]!.semester;
    }
    return typeof currentUser?.semester === 'number' ? currentUser.semester : 1;
  })();

  const { data: deptTimetable } = useGetTimetableByDeptQuery(
    { departmentId: deptId ?? '', semester: derivedSemester, academicYear },
    { skip: !deptId }
  );

  // 2. Query Marked Sessions on Selected Date (to prevent duplicate submissions)
  const { data: markedSessions } = useGetFacultyMarkedSessionsQuery(
    { date },
    { skip: !date }
  );

  // 3. Query Students for Selected Batch
  const { data: usersData, isLoading: loadingStudents } = useGetUsersQuery(
    { role: 'student', batch: batchId || undefined, limit: 100 },
    { skip: !batchId }
  );

  const [markAttendance, { isLoading: submitting }] = useMarkAttendanceMutation();

  // Day of week name for selected date
  const selectedDayName = date ? DAYS_OF_WEEK[new Date(date).getDay()] ?? 'Monday' : 'Monday';

  // Combine timetables
  const allTimetables: TimetableDoc[] = [];
  if (facultyTimetables && Array.isArray(facultyTimetables)) {
    allTimetables.push(...facultyTimetables);
  }
  if (deptTimetable && !allTimetables.some((t) => t._id === deptTimetable._id)) {
    allTimetables.push(deptTimetable);
  }

  // Detect today's / selected date's scheduled classes from timetable entries
  interface ScheduledClassEntry {
    batchId: string;
    subjectId: string;
    timeSlotId: string;
    subjectName: string;
    subjectCode: string;
    batchName: string;
    timeSlot: TimeSlot;
  }

  const scheduledClasses: ScheduledClassEntry[] = [];
  const scheduledTimeSlotsMap = new Map<string, TimeSlot>();

  for (const tt of allTimetables) {
    if (tt.status === 'published' && tt.entries) {
      for (const entry of tt.entries) {
        const fId    = typeof entry.faculty  === 'object' ? entry.faculty?._id  : entry.faculty;
        const eBatch = typeof entry.batch    === 'object' ? entry.batch         : null;
        const eSubj  = typeof entry.subject  === 'object' ? entry.subject       : null;
        const eSlot  = typeof entry.timeSlot === 'object' ? (entry.timeSlot as TimeSlot) : null;

        const isFacultyMatch = !currentUser?._id || String(fId) === String(currentUser._id);
        const isDayMatch     = eSlot && eSlot.day === selectedDayName;

        if (isFacultyMatch && isDayMatch && eSlot?._id && eBatch && eSubj) {
          const bId = typeof eBatch === 'object' ? eBatch._id : eBatch;
          const sId = typeof eSubj  === 'object' ? eSubj._id  : eSubj;

          const sCode = typeof eSubj === 'object' ? eSubj.code : 'SUBJ';
          const sName = typeof eSubj === 'object' ? eSubj.name : 'Subject';
          const bName = typeof eBatch === 'object' ? `Yr ${eBatch.year}${eBatch.section}` : 'Batch';

          scheduledClasses.push({
            batchId: String(bId),
            subjectId: String(sId),
            timeSlotId: String(eSlot._id),
            subjectName: sName,
            subjectCode: sCode,
            batchName: bName,
            timeSlot: eSlot,
          });

          // Check if matches currently selected Batch & Subject
          const matchesBatch   = !batchId   || String(bId) === String(batchId);
          const matchesSubject = !subjectId || String(sId) === String(subjectId);

          if (matchesBatch && matchesSubject) {
            scheduledTimeSlotsMap.set(eSlot._id, eSlot);
          }
        }
      }
    }
  }

  // Filter display slots: ONLY detected scheduled slots for selected date/batch/subject!
  const displaySlots = Array.from(scheduledTimeSlotsMap.values());
  const hasScheduledClasses = scheduledClasses.length > 0;

  // Check if attendance for selected slot/batch/subject is already marked in DB
  const isAlreadyMarkedInDb = (slotId: string): boolean => {
    if (!markedSessions || !slotId) return false;
    return markedSessions.some((m) => {
      const mSlotId  = typeof m.timeSlot === 'object' ? m.timeSlot._id : m.timeSlot;
      const mBatchId = typeof m.batch    === 'object' ? m.batch._id    : m.batch;
      const mSubjId  = typeof m.subject  === 'object' ? m.subject._id  : m.subject;

      return (
        String(mSlotId) === String(slotId) &&
        (!batchId || String(mBatchId) === String(batchId)) &&
        (!subjectId || String(mSubjId) === String(subjectId))
      );
    });
  };

  const selectedSlotIsMarked = isAlreadyMarkedInDb(timeSlotId);

  // Auto-select batch, subject, slot when scheduled classes detected
  useEffect(() => {
    if (scheduledClasses.length > 0) {
      const first = scheduledClasses[0]!;
      if (!batchId)   setBatchId(first.batchId);
      if (!subjectId) setSubjectId(first.subjectId);
    }
  }, [date, hasScheduledClasses]);

  // Auto-select slot if exactly 1 slot available
  useEffect(() => {
    if (displaySlots.length === 1 && displaySlots[0]?._id) {
      setTimeSlotId(displaySlots[0]._id);
    } else if (displaySlots.length === 0) {
      setTimeSlotId('');
    }
  }, [date, batchId, subjectId, displaySlots.length]);

  // Load students for batch roster
  useEffect(() => {
    if (usersData?.items && batchId) {
      const matchingStudents = usersData.items.filter((u) => {
        if (!u.batch) return true;
        const bId = typeof u.batch === 'object' ? u.batch._id : u.batch;
        return String(bId) === String(batchId);
      });

      const studentList = matchingStudents.length > 0 ? matchingStudents : usersData.items;

      setRecords(
        studentList.map((student) => ({
          student,
          status: 'present',
        }))
      );
    } else {
      setRecords([]);
    }
  }, [usersData, batchId]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (selectedSlotIsMarked) return;
    setRecords((prev) =>
      prev.map((r) => (r.student._id === studentId ? { ...r, status } : r))
    );
  };

  const handleBulkMark = (status: 'present' | 'absent') => {
    if (selectedSlotIsMarked) return;
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotIsMarked) {
      toast.error('Attendance for this session has already been submitted.');
      return;
    }

    if (!batchId || !subjectId || !timeSlotId || !date) {
      toast.error('Please select Date, Batch, Subject, and Time Slot.');
      return;
    }

    if (records.length === 0) {
      toast.error('No students found in the selected batch roster.');
      return;
    }

    try {
      await markAttendance({
        batchId,
        subjectId,
        timeSlotId,
        date,
        academicYear,
        records: records.map((r) => ({
          studentId: r.student._id,
          status: r.status,
          remarks: r.remarks,
        })),
      }).unwrap();

      toast.success(`Attendance submitted successfully for ${records.length} students.`);
    } catch (err: any) {
      const msg = err?.data?.message ?? 'Failed to submit attendance.';
      toast.error(msg);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const inputCls =
    'w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Attendance"
        subtitle={`Scheduled lectures & student roster · Instructor: ${currentUser?.name ?? 'Faculty'}`}
      />

      {/* Main Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" /> Scheduled Lecture Parameters
            </h2>

            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {hasScheduledClasses && (
                <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Sparkles size={13} /> {scheduledClasses.length} Scheduled Lecture(s) on {selectedDayName}
                </span>
              )}
              {selectedSlotIsMarked && (
                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckSquare size={13} /> Already Marked ✓
                </span>
              )}
            </div>
          </div>

          {/* Already Marked Alert Banner */}
          {selectedSlotIsMarked && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Attendance Already Submitted</p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                  Attendance for this scheduled lecture on {date} has already been recorded and submitted.
                </p>
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Selection */}
            <div>
              <label htmlFor="att-date" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Date ({selectedDayName})
              </label>
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeSlotId('');
                }}
                className={inputCls}
                required
              />
            </div>

            {/* Batch Selection */}
            <div>
              <label htmlFor="att-batch" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Batch
              </label>
              <select
                id="att-batch"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setTimeSlotId('');
                }}
                className={inputCls}
                required
              >
                <option value="">— Select Batch —</option>
                {batches?.items.map((b) => (
                  <option key={b._id} value={b._id}>
                    {typeof b.program === 'object' ? b.program.name : 'Batch'} - Yr {b.year}{b.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label htmlFor="att-subject" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                id="att-subject"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTimeSlotId('');
                }}
                className={inputCls}
                required
              >
                <option value="">— Select Subject —</option>
                {subjects?.items.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code}) {s.isLab ? '· Lab' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Selection (ONLY detected scheduled slots) */}
            <div>
              <label htmlFor="att-slot" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Time Slot ({displaySlots.length} available)
              </label>
              <select
                id="att-slot"
                value={timeSlotId}
                onChange={(e) => setTimeSlotId(e.target.value)}
                className={inputCls}
                required
                disabled={displaySlots.length === 0}
              >
                {displaySlots.length === 0 ? (
                  <option value="">
                    {hasScheduledClasses
                      ? `— No slot for this Batch & Subject on ${selectedDayName} —`
                      : `— No scheduled classes on ${selectedDayName} —`}
                  </option>
                ) : (
                  <>
                    <option value="">— Select Time Slot —</option>
                    {displaySlots.map((s) => {
                      const marked = isAlreadyMarkedInDb(s._id);
                      return (
                        <option key={s._id} value={s._id}>
                          {s.day} {s.startTime}–{s.endTime} {marked ? '✓ (Already Marked)' : ''}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Detected Classes Cards list for quick visibility */}
          {loadingTimetable ? (
            <div className="mt-4 flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" /> Detecting timetable schedule…
            </div>
          ) : scheduledClasses.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <BookOpen size={14} className="text-blue-500" /> Detected Timetable Lectures for {selectedDayName}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {scheduledClasses.map((sc, idx) => {
                  const marked = isAlreadyMarkedInDb(sc.timeSlotId);
                  const isSelected = batchId === sc.batchId && subjectId === sc.subjectId && timeSlotId === sc.timeSlotId;

                  return (
                    <button
                      key={`${sc.timeSlotId}-${idx}`}
                      type="button"
                      onClick={() => {
                        setBatchId(sc.batchId);
                        setSubjectId(sc.subjectId);
                        setTimeSlotId(sc.timeSlotId);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                          : marked
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                            : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{sc.subjectCode} · {sc.batchName}</p>
                        <p className="text-[11px] opacity-80">{sc.timeSlot.startTime}–{sc.timeSlot.endTime}</p>
                      </div>
                      {marked ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full shrink-0">
                          Marked ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full shrink-0">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500 shrink-0" />
              <span>No lectures are scheduled in your published timetable for {selectedDayName}.</span>
            </div>
          )}
        </div>

        {/* Student Roster Section */}
        {batchId && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Student Roster ({records.length} Students)
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Present: <span className="font-semibold text-green-600 dark:text-green-400">{presentCount}</span> · Absent: <span className="font-semibold text-red-600 dark:text-red-400">{records.length - presentCount}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedSlotIsMarked || displaySlots.length === 0}
                  onClick={() => handleBulkMark('present')}
                  className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-green-200 dark:border-green-800 disabled:opacity-50"
                >
                  <UserCheck size={14} /> Mark All Present
                </button>
                <button
                  type="button"
                  disabled={selectedSlotIsMarked || displaySlots.length === 0}
                  onClick={() => handleBulkMark('absent')}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50"
                >
                  <XCircle size={14} /> Mark All Absent
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-blue-500" size={24} />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center py-8 text-xs text-gray-400">
                No students found in this batch roster.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {records.map((r, idx) => (
                  <div
                    key={r.student._id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-6">
                        {idx + 1}.
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {r.student.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {r.student.enrollmentNumber ? `ID: ${r.student.enrollmentNumber}` : r.student.email}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={selectedSlotIsMarked || displaySlots.length === 0}
                        onClick={() => handleStatusChange(r.student._id, 'present')}
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          r.status === 'present'
                            ? 'bg-green-500 text-white border-green-500 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                        }`}
                      >
                        <CheckCircle2 size={13} /> Present
                      </button>
                      <button
                        type="button"
                        disabled={selectedSlotIsMarked || displaySlots.length === 0}
                        onClick={() => handleStatusChange(r.student._id, 'absent')}
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          r.status === 'absent'
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                        }`}
                      >
                        <XCircle size={13} /> Absent
                      </button>
                      <button
                        type="button"
                        disabled={selectedSlotIsMarked || displaySlots.length === 0}
                        onClick={() => handleStatusChange(r.student._id, 'late')}
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          r.status === 'late'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                        }`}
                      >
                        <Clock size={13} /> Late
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            {records.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || selectedSlotIsMarked || displaySlots.length === 0}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  {selectedSlotIsMarked
                    ? 'Already Marked ✓'
                    : displaySlots.length === 0
                      ? 'No Scheduled Class Slot'
                      : submitting
                        ? 'Submitting…'
                        : 'Submit Attendance'}
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
