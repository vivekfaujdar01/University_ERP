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
