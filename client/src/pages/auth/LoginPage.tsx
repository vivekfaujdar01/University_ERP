import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
  { role: 'Faculty', email: 'faculty@university.edu', password: 'Faculty@123' },
  { role: 'Student', email: 'student@university.edu', password: 'Student@123' },
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
      void navigate(ROLE_REDIRECT[currentUser.role] ?? '/dashboard', { replace: true });
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
      // Navigation handled by the useEffect above once Redux state updates
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Invalid email or password';
      toast.error(message);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg" aria-hidden="true">U</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">University ERP</div>
              <div className="text-slate-400 text-xs">Academic Management System</div>
            </div>
          </div>

          <h1 className="text-white text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account</p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Login form"
          >
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={cn(
                    'w-full bg-white/5 border text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none transition-colors',
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={cn(
                      'w-full bg-white/5 border text-white placeholder-slate-500 rounded-lg px-4 py-3 pr-11 text-sm outline-none transition-colors',
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-400">
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
                  'w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20',
                  isLoading && 'opacity-75 cursor-not-allowed'
                )}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              id="back-to-home"
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 glass rounded-xl p-4">
          <p className="text-slate-500 text-xs text-center mb-3 font-medium uppercase tracking-wide">
            Demo accounts — click to fill
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => fillDemo(cred.email, cred.password)}
                className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg py-2 px-3 transition-colors text-left"
                aria-label={`Fill demo credentials for ${cred.role}`}
              >
                <span className="font-medium text-slate-300 w-24">{cred.role}</span>
                <span className="text-slate-500">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
