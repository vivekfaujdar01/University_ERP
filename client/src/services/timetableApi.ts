import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type {
  TimetableDoc, GenerateTimetableInput, OverrideEntryInput,
} from '../types';

interface SingleTT  { status: string; data: { timetable: TimetableDoc } }
interface ListTT    { status: string; data: TimetableDoc[] }

export const timetableApi = createApi({
  reducerPath: 'timetableApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL as string,
    credentials: 'include',
    prepareHeaders(headers, { getState }) {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Timetable'],
  endpoints: (b) => ({

    generate: b.mutation<TimetableDoc, GenerateTimetableInput>({
      query: (body) => ({ url: '/timetable/generate', method: 'POST', body }),
      transformResponse: (r: SingleTT) => r.data.timetable,
      invalidatesTags: ['Timetable'],
    }),

    getTimetable: b.query<TimetableDoc, string>({
      query: (id) => `/timetable/${id}`,
      transformResponse: (r: SingleTT) => r.data.timetable,
      providesTags: (_r, _e, id) => [{ type: 'Timetable', id }],
    }),

    getTimetableByDept: b.query<TimetableDoc | null, { departmentId: string; semester: number; academicYear: string }>({
      query: (p) => ({ url: '/timetable/by-dept', params: p }),
      transformResponse: (r: { status: string; data: { timetable: TimetableDoc | null } }) =>
        r.data.timetable,
      providesTags: ['Timetable'],
    }),

    getFacultyTimetable: b.query<TimetableDoc[], { facultyId: string; academicYear: string }>({
      query: ({ facultyId, academicYear }) => ({
        url: `/timetable/faculty/${facultyId}`,
        params: { academicYear },
      }),
      transformResponse: (r: ListTT) => r.data,
      providesTags: ['Timetable'],
    }),

    getStudentTimetable: b.query<TimetableDoc[], { studentId: string; academicYear: string }>({
      query: ({ studentId, academicYear }) => ({
        url: `/timetable/student/${studentId}`,
        params: { academicYear },
      }),
      transformResponse: (r: ListTT) => r.data,
      providesTags: ['Timetable'],
    }),

    publishTimetable: b.mutation<TimetableDoc, string>({
      query: (id) => ({ url: `/timetable/${id}/publish`, method: 'POST' }),
      transformResponse: (r: SingleTT) => r.data.timetable,
      invalidatesTags: ['Timetable'],
    }),

    overrideEntry: b.mutation<TimetableDoc, { id: string } & OverrideEntryInput>({
      query: ({ id, ...body }) => ({ url: `/timetable/${id}/override`, method: 'PUT', body }),
      transformResponse: (r: SingleTT) => r.data.timetable,
      invalidatesTags: ['Timetable'],
    }),
  }),
});

export const {
  useGenerateMutation,
  useGetTimetableQuery,
  useGetTimetableByDeptQuery,
  useGetFacultyTimetableQuery,
  useGetStudentTimetableQuery,
  usePublishTimetableMutation,
  useOverrideEntryMutation,
} = timetableApi;
