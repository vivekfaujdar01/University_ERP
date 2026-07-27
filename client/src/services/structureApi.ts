import { createApi } from '@reduxjs/toolkit/query/react';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import type {
  Department, Program, Batch, Subject, Room, TimeSlot, User,
  CreateDepartmentInput, CreateProgramInput, CreateBatchInput,
  CreateSubjectInput, CreateRoomInput, CreateTimeSlotInput, CreateUserInput,
  BulkImportResult,
} from '../types';

// ─── Paginated list response shape ───────────────────────────────────────────
interface ListData<T> { items: T[]; total: number; page: number; limit: number; }
interface ListResponse<T> { status: string; data: ListData<T>; }
interface SingleResponse<T> { status: string; data: T; }
interface BulkResponse { status: string; data: BulkImportResult; }

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  department?: string;
  program?: string;
  role?: string;
  semester?: number;
  batch?: string;
}

export const structureApi = createApi({
  reducerPath: 'structureApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL as string,
    credentials: 'include',
    prepareHeaders(headers, { getState }) {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Department', 'Program', 'Batch', 'Subject', 'Room', 'TimeSlot', 'User'],
  endpoints: (b) => ({

    // ── Departments ──────────────────────────────────────────────────────────
    getDepartments: b.query<ListData<Department>, ListQuery>({
      query: (q = {}) => ({ url: '/departments', params: q }),
      transformResponse: (r: ListResponse<Department>) => r.data,
      providesTags: ['Department'],
    }),
    getDepartment: b.query<Department, string>({
      query: (id) => `/departments/${id}`,
      transformResponse: (r: SingleResponse<Department>) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Department', id }],
    }),
    createDepartment: b.mutation<Department, CreateDepartmentInput>({
      query: (body) => ({ url: '/departments', method: 'POST', body }),
      transformResponse: (r: SingleResponse<Department>) => r.data,
      invalidatesTags: ['Department'],
    }),
    updateDepartment: b.mutation<Department, { id: string; data: Partial<CreateDepartmentInput> & { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/departments/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<Department>) => r.data,
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: b.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Department'],
    }),

    // ── Programs ─────────────────────────────────────────────────────────────
    getPrograms: b.query<ListData<Program>, ListQuery>({
      query: (q = {}) => ({ url: '/programs', params: q }),
      transformResponse: (r: ListResponse<Program>) => r.data,
      providesTags: ['Program'],
    }),
    createProgram: b.mutation<Program, CreateProgramInput>({
      query: (body) => ({ url: '/programs', method: 'POST', body }),
      transformResponse: (r: SingleResponse<Program>) => r.data,
      invalidatesTags: ['Program', 'Department'],
    }),
    updateProgram: b.mutation<Program, { id: string; data: Partial<CreateProgramInput> & { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/programs/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<Program>) => r.data,
      invalidatesTags: ['Program'],
    }),
    deleteProgram: b.mutation<void, string>({
      query: (id) => ({ url: `/programs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Program', 'Department'],
    }),

    // ── Batches ──────────────────────────────────────────────────────────────
    getBatches: b.query<ListData<Batch>, ListQuery>({
      query: (q = {}) => ({ url: '/batches', params: q }),
      transformResponse: (r: ListResponse<Batch>) => r.data,
      providesTags: ['Batch'],
    }),
    createBatch: b.mutation<Batch, CreateBatchInput>({
      query: (body) => ({ url: '/batches', method: 'POST', body }),
      transformResponse: (r: SingleResponse<Batch>) => r.data,
      invalidatesTags: ['Batch'],
    }),
    updateBatch: b.mutation<Batch, { id: string; data: Partial<CreateBatchInput> & { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/batches/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<Batch>) => r.data,
      invalidatesTags: ['Batch'],
    }),
    deleteBatch: b.mutation<void, string>({
      query: (id) => ({ url: `/batches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Batch'],
    }),

    // ── Subjects ─────────────────────────────────────────────────────────────
    getSubjects: b.query<ListData<Subject>, ListQuery>({
      query: (q = {}) => ({ url: '/subjects', params: q }),
      transformResponse: (r: ListResponse<Subject>) => r.data,
      providesTags: ['Subject'],
    }),
    createSubject: b.mutation<Subject, CreateSubjectInput>({
      query: (body) => ({ url: '/subjects', method: 'POST', body }),
      transformResponse: (r: SingleResponse<Subject>) => r.data,
      invalidatesTags: ['Subject'],
    }),
    updateSubject: b.mutation<Subject, { id: string; data: Partial<CreateSubjectInput> & { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/subjects/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<Subject>) => r.data,
      invalidatesTags: ['Subject'],
    }),
    deleteSubject: b.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subject'],
    }),

    // ── Rooms ────────────────────────────────────────────────────────────────
    getRooms: b.query<ListData<Room>, ListQuery>({
      query: (q = {}) => ({ url: '/rooms', params: q }),
      transformResponse: (r: ListResponse<Room>) => r.data,
      providesTags: ['Room'],
    }),
    createRoom: b.mutation<Room, CreateRoomInput>({
      query: (body) => ({ url: '/rooms', method: 'POST', body }),
      transformResponse: (r: SingleResponse<Room>) => r.data,
      invalidatesTags: ['Room'],
    }),
    updateRoom: b.mutation<Room, { id: string; data: Partial<CreateRoomInput> & { isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/rooms/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<Room>) => r.data,
      invalidatesTags: ['Room'],
    }),
    deleteRoom: b.mutation<void, string>({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Room'],
    }),

    // ── TimeSlots ────────────────────────────────────────────────────────────
    getTimeSlots: b.query<ListData<TimeSlot>, ListQuery>({
      query: (q = {}) => ({ url: '/timeslots', params: q }),
      transformResponse: (r: ListResponse<TimeSlot>) => r.data,
      providesTags: ['TimeSlot'],
    }),
    createTimeSlot: b.mutation<TimeSlot, CreateTimeSlotInput>({
      query: (body) => ({ url: '/timeslots', method: 'POST', body }),
      transformResponse: (r: SingleResponse<TimeSlot>) => r.data,
      invalidatesTags: ['TimeSlot'],
    }),
    updateTimeSlot: b.mutation<TimeSlot, { id: string; data: Partial<CreateTimeSlotInput> }>({
      query: ({ id, data }) => ({ url: `/timeslots/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<TimeSlot>) => r.data,
      invalidatesTags: ['TimeSlot'],
    }),
    deleteTimeSlot: b.mutation<void, string>({
      query: (id) => ({ url: `/timeslots/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TimeSlot'],
    }),

    // ── Users ────────────────────────────────────────────────────────────────
    getUsers: b.query<ListData<User>, ListQuery>({
      query: (q = {}) => ({ url: '/users', params: q }),
      transformResponse: (r: ListResponse<User>) => r.data,
      providesTags: ['User'],
    }),
    getUser: b.query<User, string>({
      query: (id) => `/users/${id}`,
      transformResponse: (r: SingleResponse<{ user: User }>) => r.data.user,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: b.mutation<User, CreateUserInput>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (r: SingleResponse<{ user: User }>) => r.data.user,
      invalidatesTags: ['User'],
    }),
    updateUser: b.mutation<User, { id: string; data: Partial<CreateUserInput> & { isActive?: boolean; subjectsAssigned?: string[]; preferredSlots?: string[] } }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PUT', body: data }),
      transformResponse: (r: SingleResponse<{ user: User }>) => r.data.user,
      invalidatesTags: ['User'],
    }),
    deleteUser: b.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    bulkImportUsers: b.mutation<BulkImportResult, FormData>({
      query: (formData) => ({ url: '/users/bulk-import', method: 'POST', body: formData }),
      transformResponse: (r: BulkResponse) => r.data,
      invalidatesTags: ['User'],
    }),
    updateFacultyProfile: b.mutation<User, { id: string; subjectsAssigned: string[]; preferredSlots: string[] }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}/profile`, method: 'PUT', body }),
      transformResponse: (r: SingleResponse<{ user: User }>) => r.data.user,
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery, useGetDepartmentQuery, useCreateDepartmentMutation,
  useUpdateDepartmentMutation, useDeleteDepartmentMutation,
  useGetProgramsQuery, useCreateProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation,
  useGetBatchesQuery, useCreateBatchMutation, useUpdateBatchMutation, useDeleteBatchMutation,
  useGetSubjectsQuery, useCreateSubjectMutation, useUpdateSubjectMutation, useDeleteSubjectMutation,
  useGetRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation,
  useGetTimeSlotsQuery, useCreateTimeSlotMutation, useUpdateTimeSlotMutation, useDeleteTimeSlotMutation,
  useGetUsersQuery, useGetUserQuery, useCreateUserMutation, useUpdateUserMutation,
  useDeleteUserMutation, useBulkImportUsersMutation, useUpdateFacultyProfileMutation,
} = structureApi;
