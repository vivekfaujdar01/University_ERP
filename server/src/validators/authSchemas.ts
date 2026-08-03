import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  // refresh token comes from httpOnly cookie — no body fields needed
  // but we define an empty object schema so validate() middleware still works
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['super_admin', 'hod', 'faculty', 'student']).default('student'),

  phone: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
});


export type RegisterInput = z.infer<typeof registerSchema>;

