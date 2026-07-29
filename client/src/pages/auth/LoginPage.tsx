import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, GraduationCap, ArrowLeft, KeyRound } from 'lucide-react';
import { useLoginMutation } from '@/services/authApi';
import { selectIsAuthenticated, selectCurrentUser } from '@/features/authSlice';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

// ─── Zod schema ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ─── Role → dashboard route map ──────────────────────────────────────────────
const ROLE_REDIRECT: Record<Role, string> = {
  super_admin: '/admin/dashboard',
  hod: '/hod/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
  finance_officer: '/finance/dashboard',
};

const DEMO_CREDENTIALS = [
  { role: 'Super Admin', email: 'admin@university.edu', password: 'Admin@123' },
  { role: 'HOD', email: 'hod@university.edu', password: 'Hod@1234' },
  { role: 'Faculty 1', email: 'faculty@university.edu', password: 'Faculty@123' },
  { role: 'Faculty 2', email: 'ananya.faculty@university.edu', password: 'Faculty@123' },
  { role: 'Student 1', email: 'student@university.edu', password: 'Student@123' },
  { role: 'Student 2', email: 'riya.student@university.edu', password: 'Student@123' },
  { role: 'Finance', email: 'finance@university.edu', password: 'Finance@123' },
];

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = React.useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      void navigate(ROLE_REDIRECT[currentUser.role] ?? '/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data).unwrap();
      toast.success('Signed in successfully');
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Invalid email or password';
      toast.error(message);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    toast.info(`Filled credentials for ${email}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Top Header Link */}
        <div className="flex items-center justify-between px-1">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Landing Page
          </Link>
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/40 px-2.5 py-0.5 rounded-full">
            ERP Portal Login
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">University ERP</div>
              <div className="text-xs text-blue-400 font-medium mt-1">Academic & Portal Access</div>
            </div>
          </div>

          <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="text-slate-400 text-xs mb-6">Sign in to access your administrative or student portal</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Login form">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  aria-invalid={!!errors.email}
                  className={cn(
                    'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150',
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1 text-xs text-red-400 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className={cn(
                      'w-full bg-slate-950/80 border text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-150',
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
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

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 mt-2',
                  isLoading && 'opacity-75 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Authenticating…
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Credentials Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={15} className="text-blue-400" />
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Quick Demo Accounts (Click to Fill)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => fillDemo(cred.email, cred.password)}
                className="flex items-center justify-between text-xs text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl py-2 px-3 transition-all text-left group"
                aria-label={`Fill demo credentials for ${cred.role}`}
              >
                <span className="font-semibold text-blue-400 group-hover:text-blue-300">{cred.role}</span>
                <span className="text-[11px] text-slate-500 truncate ml-2">{cred.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
