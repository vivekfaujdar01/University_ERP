import { z } from 'zod';

// ─── Department ───────────────────────────────────────────────────────────────

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
  hod: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId').optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Program ──────────────────────────────────────────────────────────────────

export const createProgramSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
  department: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid department ID'),
  durationYears: z.number().int().min(1).max(6),
  totalSemesters: z.number().int().min(1).max(12),
});

export const updateProgramSchema = createProgramSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Batch ────────────────────────────────────────────────────────────────────

export const createBatchSchema = z.object({
  program: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid program ID'),
  year: z.number().int().min(2000).max(2100),
  section: z.string().min(1).max(5).trim().toUpperCase(),
  maxStudents: z.number().int().min(1).max(500),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY (e.g. 2024-25)')
    .optional(),
});

export const updateBatchSchema = createBatchSchema.partial().extend({
  isActive: z.boolean().optional(),
  currentStudentCount: z.number().int().min(0).optional(),
});

// ─── Subject ──────────────────────────────────────────────────────────────────

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
  credits: z.number().int().min(1).max(5),
  isLab: z.boolean().optional().default(false),
  hoursPerWeek: z.number().int().min(1).max(20),
  department: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid department ID'),
  program: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid program ID'),
  semester: z.number().int().min(1).max(12),
  subjectType: z.enum(['theory', 'lab', 'tutorial', 'project']).optional().default('theory'),
});

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Room ─────────────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').trim(),
  capacity: z.number().int().min(1).max(1000),
  isLab: z.boolean().optional().default(false),
  building: z.string().trim().optional(),
  floor: z.number().int().optional(),
  facilities: z.array(z.string().trim()).optional().default([]),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── TimeSlot ─────────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createTimeSlotSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  slotNumber: z.number().int().min(1).optional(),
  isLunchBreak: z.boolean().optional().default(false),
});

export const updateTimeSlotSchema = createTimeSlotSchema.partial();

// ─── User create / update ─────────────────────────────────────────────────────

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name is required').trim(),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['super_admin', 'hod', 'faculty', 'student', 'finance_officer']),
    phone: z.string().trim().optional(),
    // Student fields
    enrollmentNumber: z.string().trim().optional(),
    program: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    batch: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    semester: z.number().int().min(1).max(12).optional(),
    admissionYear: z.number().int().min(2000).max(2100).optional(),
    // Faculty fields
    employeeId: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    department: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    maxHoursPerDay: z.number().int().min(1).max(10).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.enrollmentNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enrollmentNumber'], message: 'Enrollment number is required for students' });
      }
      if (!data.program) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['program'], message: 'Program is required for students' });
      }
      if (!data.batch) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['batch'], message: 'Batch is required for students' });
      }
    }
    if (data.role === 'faculty' || data.role === 'hod') {
      if (!data.employeeId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['employeeId'], message: 'Employee ID is required for faculty/HOD' });
      }
      if (!data.department) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['department'], message: 'Department is required for faculty/HOD' });
      }
    }
  });

export const updateUserSchema = z.object({
  name: z.string().min(2).trim().optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  designation: z.string().trim().optional(),
  department: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  maxHoursPerDay: z.number().int().min(1).max(10).optional(),
  subjectsAssigned: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
  preferredSlots: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  batch: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  department: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  program: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  role: z.enum(['super_admin', 'hod', 'faculty', 'student', 'finance_officer']).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  batch: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
