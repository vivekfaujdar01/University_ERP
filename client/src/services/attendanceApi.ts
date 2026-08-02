import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type { User, Batch, Subject, TimeSlot } from '../types';

// Derive current academic year dynamically (e.g. "2025-26") so defaults
// never fall out of date when the calendar year rolls over.
function currentAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y - 1}-${String(y).slice(2)}`;
}

export interface AttendanceRecordInput {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface MarkAttendancePayload {
  batchId: string;
  subjectId: string;
  timeSlotId: string;
  date: string; // YYYY-MM-DD
  academicYear: string;
  records: AttendanceRecordInput[];
}

export interface SubjectAttendanceSummary {
  subject: Subject;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  isDefaulter: boolean;
  logs: Array<{
    date: string;
    timeSlot: TimeSlot;
    facultyName: string;
    status: 'present' | 'absent' | 'late';
  }>;
}

export interface StudentAttendanceSummary {
  studentId: string;
  academicYear: string;
  overallPercentage: number;
  isOverallDefaulter: boolean;
  totalClasses: number;
  attendedClasses: number;
  subjects: SubjectAttendanceSummary[];
}

export interface BatchAttendanceStat {
  student: User;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  isDefaulter: boolean;
}

export interface BatchAttendanceReport {
  batchId: string;
  academicYear: string;
  totalSessions: number;
  totalStudents: number;
  defaulterCount: number;
  studentStats: BatchAttendanceStat[];
  sessions: any[];
}

export interface DefaulterItem {
  student: User & { batch?: Batch };
  overallPercentage: number;
  totalClasses: number;
  attendedClasses: number;
  criticalSubjects: string[];
}

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL as string,
    credentials: 'include',
    prepareHeaders(headers, { getState }) {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Attendance', 'Defaulters'],
  endpoints: (b) => ({
    markAttendance: b.mutation<{ status: string; data: { attendance: any } }, MarkAttendancePayload>({
      query: (body) => ({ url: '/attendance/mark', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Defaulters'],
    }),

    getFacultyMarkedSessions: b.query<any[], { date: string }>({
      query: ({ date }) => ({
        url: '/attendance/faculty-marked',
        params: { date },
      }),
      transformResponse: (r: { status: string; data: { sessions: any[] } }) =>
        r.data.sessions,
      providesTags: ['Attendance'],
    }),

    getStudentSummary: b.query<
      StudentAttendanceSummary,
      { studentId: string; academicYear?: string }
    >({
      query: ({ studentId, academicYear = currentAcademicYear() }) => ({
        url: `/attendance/student/${studentId}/summary`,
        params: { academicYear },
      }),
      transformResponse: (r: { status: string; data: { summary: StudentAttendanceSummary } }) =>
        r.data.summary,
      providesTags: ['Attendance'],
    }),

    getBatchReport: b.query<
      BatchAttendanceReport,
      { batchId: string; academicYear?: string; subjectId?: string }
    >({
      query: ({ batchId, academicYear = currentAcademicYear(), subjectId }) => ({
        url: `/attendance/batch/${batchId}/report`,
        params: { academicYear, subjectId },
      }),
      transformResponse: (r: { status: string; data: { report: BatchAttendanceReport } }) =>
        r.data.report,
      providesTags: ['Attendance'],
    }),

    getDefaulters: b.query<DefaulterItem[], { academicYear?: string; batchId?: string }>({
      query: ({ academicYear = currentAcademicYear(), batchId }) => ({
        url: '/attendance/defaulters',
        params: { academicYear, batchId },
      }),
      transformResponse: (r: { status: string; data: { defaulters: DefaulterItem[] } }) =>
        r.data.defaulters,
      providesTags: ['Defaulters'],
    }),

    notifyDefaulters: b.mutation<
      { totalDefaulters: number; emailsSent: number },
      { academicYear?: string }
    >({
      query: (body) => ({ url: '/attendance/defaulters/notify', method: 'POST', body }),
      invalidatesTags: ['Defaulters'],
    }),
  }),
});

export const {
  useMarkAttendanceMutation,
  useGetFacultyMarkedSessionsQuery,
  useGetStudentSummaryQuery,
  useGetBatchReportQuery,
  useGetDefaultersQuery,
  useNotifyDefaultersMutation,
} = attendanceApi;
