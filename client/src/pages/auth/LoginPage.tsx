import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LoginPage — Stub for T1. Full implementation with React Hook Form + JWT in T2.
 */
export default function LoginPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">University ERP</div>
              <div className="text-slate-400 text-xs">Academic Management System</div>
            </div>
          </div>

          <h1 className="text-white text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account</p>

          {/* Form stub — full implementation in T2 */}
          <div className="space-y-5">
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
                placeholder="you@university.edu"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                aria-label="Email address"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                aria-label="Password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="button"
              disabled
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-150 opacity-60 cursor-not-allowed text-sm"
              title="Authentication implemented in T2"
            >
              Sign In (Coming in T2)
            </button>
          </div>

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

        {/* Role hints */}
        <div className="mt-4 glass rounded-xl p-4">
          <p className="text-slate-500 text-xs text-center mb-3 font-medium">
            Available roles (seed data added in T2)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['Super Admin', 'HOD', 'Faculty', 'Student', 'Finance Officer'].map((role) => (
              <span
                key={role}
                className="text-center text-xs text-slate-400 bg-white/5 rounded-lg py-1.5 px-2"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
