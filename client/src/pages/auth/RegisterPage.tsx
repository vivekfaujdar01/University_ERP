import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Building2,
} from 'lucide-react';

import { useRegisterMutation } from '@/services/authApi';
import { selectIsAuthenticated, selectCurrentUser } from '@/features/authSlice';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

// ─── Zod Schema for Registration Form ───────────────────────────────────────
const registerFormSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['student', 'faculty', 'hod', 'super_admin']),
    phone: z.string().optional(),
    employeeId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerFormSchema>;

const ROLE_REDIRECT: Record<Role, string> = {
  super_admin: '/admin/dashboard',
  hod: '/hod/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
};

const ROLES_OPTIONS = [
  { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Access course schedules & attendance' },
  { value: 'faculty', label: 'Faculty Member', icon: UserCheck, desc: 'Manage classes, timetables & grading' },
  { value: 'hod', label: 'Head of Dept (HOD)', icon: Building2, desc: 'Department management & timetable publishing' },
];


export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [registerUser, { isLoading }] = useRegisterMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      void navigate(ROLE_REDIRECT[currentUser.role] ?? '/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || undefined,
        employeeId: ['faculty', 'hod'].includes(data.role) ? data.employeeId : undefined,
      };


      await registerUser(payload).unwrap();
      toast.success('Account created successfully! Welcome to University ERP.');
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to register account. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-1">
          <Link
            to="/login"
            id="back-to-login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/80 border border-indigo-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <UserPlus size={12} /> New Account Registration
          </span>
        </div>

        {/* Card Main Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">University ERP</div>
              <div className="text-xs text-indigo-400 font-medium mt-1">Create Your Account</div>
            </div>
          </div>

          <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Create an Account</h1>
          <p className="text-slate-400 text-xs mb-6">
            Enter your information below to register as a student, faculty member, or staff.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Registration form">
            <div className="space-y-4">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    aria-invalid={!!errors.name}
                    className={cn(
                      'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150',
                      errors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    )}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="mt-1 text-xs text-red-400 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    aria-invalid={!!errors.phone}
                    className="w-full bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                    {...register('phone')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  aria-invalid={!!errors.email}
                  className={cn(
                    'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150',
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1 text-xs text-red-400 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Account Role Selection */}
              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Role <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLES_OPTIONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedRole === item.value;
                    return (
                      <label
                        key={item.value}
                        className={cn(
                          'flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150',
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-500/10'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        )}
                      >
                        <input
                          type="radio"
                          value={item.value}
                          className="sr-only"
                          {...register('role')}
                        />
                        <div
                          className={cn(
                            'p-1.5 rounded-lg mt-0.5 shrink-0',
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                          )}
                        >
                          <IconComponent size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{item.label}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Role-Specific Fields */}
              {['faculty', 'hod'].includes(selectedRole) && (

                <div>
                  <label htmlFor="employeeId" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    placeholder="EMP-9081"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                    {...register('employeeId')}
                  />
                </div>
              )}

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      aria-invalid={!!errors.password}
                      className={cn(
                        'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-150',
                        errors.password
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" role="alert" className="mt-1 text-xs text-red-400 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      aria-invalid={!!errors.confirmPassword}
                      className={cn(
                        'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-150',
                        errors.confirmPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      )}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirm-password-error" role="alert" className="mt-1 text-xs text-red-400 font-medium">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 mt-4',
                  isLoading && 'opacity-75 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Creating Account…
                  </>
                ) : (
                  'Create Account & Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              id="signin-link"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline underline-offset-2"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
