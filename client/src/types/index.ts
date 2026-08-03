// Shared TypeScript interfaces for client
// These mirror the server's Mongoose document types but without Document methods

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
} as const;


export type Role = (typeof ROLES)[keyof typeof ROLES];

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type SubjectType = 'theory' | 'lab' | 'tutorial' | 'project';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  // Student fields
  enrollmentNumber?: string;
  program?: Department | string;
  batch?: Batch | string;
  semester?: number;
  admissionYear?: number;
  cgpa?: number;
  // Faculty fields
  employeeId?: string;
  designation?: string;
  department?: Department | string;
  subjectsAssigned?: Subject[] | string[];
  preferredSlots?: TimeSlot[] | string[];
  maxHoursPerDay?: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── Structure entities ───────────────────────────────────────────────────────

export interface Department {
  _id: string;
  name: string;
  code: string;
  hod?: User | string;
  programs?: Program[] | string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  _id: string;
  name: string;
  code: string;
  department: Department | string;
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
  createdAt: string;
}

export interface Batch {
  _id: string;
  program: Program | string;
  year: number;
  section: string;
  maxStudents: number;
  currentStudentCount: number;
  academicYear?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  isLab: boolean;
  hoursPerWeek: number;
  department: Department | string;
  program: Program | string;
  semester: number;
  subjectType: SubjectType;
  isActive: boolean;
  createdAt: string;
}

export interface Room {
  _id: string;
  name: string;
  capacity: number;
  isLab: boolean;
  building?: string;
  floor?: number;
  facilities: string[];
  isActive: boolean;
  createdAt: string;
}

export interface TimeSlot {
  _id: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  slotNumber?: number;
  isLunchBreak: boolean;
  createdAt: string;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}

export interface ApiList<T> {
  status: 'success';
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

// ─── Form inputs (mirrors server Zod schemas) ────────────────────────────────

export interface CreateDepartmentInput {
  name: string;
  code: string;
  hod?: string;
}

export interface CreateProgramInput {
  name: string;
  code: string;
  department: string;
  durationYears: number;
  totalSemesters: number;
}

export interface CreateBatchInput {
  program: string;
  year: number;
  section: string;
  maxStudents: number;
  academicYear?: string;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  credits: number;
  isLab?: boolean;
  hoursPerWeek: number;
  department: string;
  program: string;
  semester: number;
  subjectType?: SubjectType;
}

export interface CreateRoomInput {
  name: string;
  capacity: number;
  isLab?: boolean;
  building?: string;
  floor?: number;
  facilities?: string[];
}

export interface CreateTimeSlotInput {
  day: WeekDay;
  startTime: string;
  endTime: string;
  slotNumber?: number;
  isLunchBreak?: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  enrollmentNumber?: string;
  program?: string;
  batch?: string;
  semester?: number;
  admissionYear?: number;
  employeeId?: string;
  designation?: string;
  department?: string;
  maxHoursPerDay?: number;
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; email: string; message: string }>;
}

// ─── Timetable (T5) ───────────────────────────────────────────────────────────

export interface TimetableEntry {
  subject:  Subject | string;
  faculty:  User | string;
  batch:    Batch | string;
  room:     Room | string;
  timeSlot: TimeSlot | string;
}

export interface TimetableConflict {
  type: 'teacher' | 'room' | 'batch' | 'capacity' | 'lab';
  description: string;
  involvedEntryIndexes: number[];
}

export interface TimetableDoc {
  _id: string;
  semester: number;
  department: Department | string;
  academicYear: string;
  status: 'draft' | 'published';
  entries: TimetableEntry[];
  conflicts: TimetableConflict[];
  isComplete: boolean;
  generatedAt: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateTimetableInput {
  departmentId: string;
  semester: number;
  academicYear: string;
}

export interface OverrideEntryInput {
  entryIndex: number;
  timeSlotId: string;
  roomId: string;
}
