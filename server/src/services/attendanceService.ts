import mongoose from 'mongoose';
import { Attendance, IAttendanceRecord } from '../models/Attendance';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { AppError } from '../utils/AppError';
import { sendAttendanceWarningEmail } from './emailService';
import { generatePdf } from './pdfService';

export interface MarkAttendanceInput {
  batchId: string;
  subjectId: string;
  timeSlotId: string;
  date: string; // ISO date string e.g. YYYY-MM-DD
  academicYear: string;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
    remarks?: string;
  }>;
}

/** Helper: Normalize Date to 00:00:00 UTC */
function normalizeDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Get list of attendance sessions marked by a faculty member on a specific date */
export const getFacultyMarkedSessions = async (facultyId: string, dateStr: string) => {
  const date = normalizeDate(dateStr);
  const docs = await Attendance.find({ faculty: facultyId, date })
    .select('batch subject timeSlot date totalStudents presentCount');
  return docs;
};

/** Mark attendance for a lecture session */
export const markAttendance = async (
  facultyId: string,
  input: MarkAttendanceInput
) => {
  const date = normalizeDate(input.date);

  // Check for duplicate submission
  const existing = await Attendance.findOne({
    batch: input.batchId,
    subject: input.subjectId,
    timeSlot: input.timeSlotId,
    date,
  });

  if (existing) {
    throw new AppError(
      'Attendance for this slot, subject, and date has already been submitted.',
      409
    );
  }

  const records: IAttendanceRecord[] = input.records.map((r) => ({
    student: new mongoose.Types.ObjectId(r.studentId),
    status: r.status,
    remarks: r.remarks,
  }));

  const totalStudents = records.length;
  const presentCount = records.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;

  const doc = await Attendance.create({
    batch: input.batchId,
    subject: input.subjectId,
    faculty: facultyId,
    timeSlot: input.timeSlotId,
    date,
    academicYear: input.academicYear,
    records,
    totalStudents,
    presentCount,
  });

  return doc;
};

/** Get per-subject and overall attendance summary for a student */
export const getStudentSummary = async (studentId: string, academicYear: string) => {
  const studentObjId = new mongoose.Types.ObjectId(studentId);

  // Find all attendance sessions containing this student
  const sessions = await Attendance.find({
    academicYear,
    'records.student': studentObjId,
  })
    .populate('subject', 'name code credits isLab')
    .populate('timeSlot', 'day startTime endTime')
    .populate('faculty', 'name');

  // Group stats by subject
  const subjectMap = new Map<
    string,
    {
      subject: any;
      totalClasses: number;
      attendedClasses: number;
      percentage: number;
      isDefaulter: boolean;
      logs: Array<{
        date: string;
        timeSlot: any;
        facultyName: string;
        status: 'present' | 'absent' | 'late';
      }>;
    }
  >();

  let overallTotal = 0;
  let overallAttended = 0;

  for (const session of sessions) {
    const subj: any = session.subject;
    if (!subj?._id) continue;
    const subjIdStr = String(subj._id);

    const record = session.records.find(
      (r) => String(r.student) === String(studentId)
    );
    if (!record) continue;

    const isPresent = record.status === 'present' || record.status === 'late';
    overallTotal += 1;
    if (isPresent) overallAttended += 1;

    if (!subjectMap.has(subjIdStr)) {
      subjectMap.set(subjIdStr, {
        subject: subj,
        totalClasses: 0,
        attendedClasses: 0,
        percentage: 0,
        isDefaulter: false,
        logs: [],
      });
    }

    const item = subjectMap.get(subjIdStr)!;
    item.totalClasses += 1;
    if (isPresent) item.attendedClasses += 1;
    item.logs.push({
      date: session.date.toISOString().split('T')[0]!,
      timeSlot: session.timeSlot,
      facultyName: (session.faculty as any)?.name ?? 'Faculty',
      status: record.status,
    });
  }

  // Calculate percentages
  const subjectSummaries = [...subjectMap.values()].map((item) => {
    const pct = item.totalClasses > 0 ? (item.attendedClasses / item.totalClasses) * 100 : 100;
    const percentage = Number(pct.toFixed(1));
    return {
      ...item,
      percentage,
      isDefaulter: percentage < 75,
    };
  });

  const overallPct = overallTotal > 0 ? (overallAttended / overallTotal) * 100 : 100;
  const overallPercentage = Number(overallPct.toFixed(1));

  return {
    studentId,
    academicYear,
    overallPercentage,
    isOverallDefaulter: overallPercentage < 75,
    totalClasses: overallTotal,
    attendedClasses: overallAttended,
    subjects: subjectSummaries,
  };
};

/** Get batch attendance matrix & defaulter report for HOD */
export const getBatchReport = async (
  batchId: string,
  academicYear: string,
  subjectId?: string
) => {
  const query: any = { batch: batchId, academicYear };
  if (subjectId) query.subject = subjectId;

  const sessions = await Attendance.find(query)
    .populate('subject', 'name code')
    .populate('faculty', 'name')
    .populate('timeSlot', 'day startTime endTime')
    .sort({ date: 1 });

  // Get all students belonging to this batch
  const students = await User.find({ batch: batchId, role: 'student' }).select('name email enrollmentNumber');

  // Compute student summary stats
  const studentStats = students.map((stu) => {
    const stuIdStr = String(stu._id);
    let total = 0;
    let attended = 0;

    for (const session of sessions) {
      const rec = session.records.find((r) => String(r.student) === stuIdStr);
      if (rec) {
        total += 1;
        if (rec.status === 'present' || rec.status === 'late') {
          attended += 1;
        }
      }
    }

    const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100;
    return {
      student: stu,
      totalClasses: total,
      attendedClasses: attended,
      percentage,
      isDefaulter: percentage < 75,
    };
  });

  const defaulterCount = studentStats.filter((s) => s.isDefaulter).length;

  return {
    batchId,
    academicYear,
    totalSessions: sessions.length,
    totalStudents: students.length,
    defaulterCount,
    studentStats,
    sessions,
  };
};

/** Get defaulters list (<75% attendance) across all batches or a specific batch */
export const getDefaulters = async (academicYear: string, batchId?: string) => {
  const query: any = { role: 'student' };
  if (batchId) query.batch = batchId;

  const students = await User.find(query).populate('batch', 'year section program');
  const defaulters: Array<{
    student: any;
    overallPercentage: number;
    totalClasses: number;
    attendedClasses: number;
    criticalSubjects: string[];
  }> = [];

  for (const stu of students) {
    const summary = await getStudentSummary(String(stu._id), academicYear);
    if (summary.isOverallDefaulter || summary.subjects.some((s) => s.isDefaulter)) {
      defaulters.push({
        student: stu,
        overallPercentage: summary.overallPercentage,
        totalClasses: summary.totalClasses,
        attendedClasses: summary.attendedClasses,
        criticalSubjects: summary.subjects.filter((s) => s.isDefaulter).map((s) => s.subject.code),
      });
    }
  }

  return defaulters;
};

/** Trigger notification emails to defaulters (< 75% attendance) */
export const checkDefaultersAndNotify = async (academicYear: string) => {
  const defaulters = await getDefaulters(academicYear);
  let sentCount = 0;

  for (const item of defaulters) {
    if (item.student.email) {
      const subjectList = item.criticalSubjects.length > 0
        ? item.criticalSubjects.join(', ')
        : 'Overall Attendance';

      await sendAttendanceWarningEmail(
        item.student.email,
        item.student.name,
        subjectList,
        item.overallPercentage
      );
      sentCount += 1;
    }
  }

  return { totalDefaulters: defaulters.length, emailsSent: sentCount };
};

/** Generate PDF report buffer for batch attendance */
export const generateBatchPdfReport = async (
  batchId: string,
  academicYear: string
): Promise<Buffer> => {
  const batch = await Batch.findById(batchId).populate('program', 'name code');
  const report = await getBatchReport(batchId, academicYear);

  const data = {
    batchName: batch ? `${(batch.program as any)?.code ?? 'PROG'} - ${batch.year}${batch.section}` : batchId,
    academicYear,
    totalSessions: report.totalSessions,
    totalStudents: report.totalStudents,
    defaulterCount: report.defaulterCount,
    studentStats: report.studentStats.map((s) => ({
      name: s.student.name,
      enrollmentNumber: s.student.enrollmentNumber ?? '—',
      attendedClasses: s.attendedClasses,
      totalClasses: s.totalClasses,
      percentage: s.percentage,
      isDefaulter: s.isDefaulter,
    })),
    generatedAt: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };

  return generatePdf('attendanceReport.hbs', data);
};
