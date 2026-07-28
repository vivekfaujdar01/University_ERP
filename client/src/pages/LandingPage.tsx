import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Zap,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Layers,
} from 'lucide-react';

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Skip to content for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight block leading-none">
              University ERP
            </span>
            <span className="text-xs text-blue-400 font-medium tracking-wide">
              Academic & Timetable Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            id="header-login-btn"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            Sign In to Portal <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main
        id="main-content"
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 max-w-5xl mx-auto"
      >
        {/* Live Feature Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-800/50 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-inner backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>DSA Constraint Scheduling & Multi-Role University Portal</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
          Next-Generation ERP with <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
            Automated DSA Scheduling
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Manage academic structure, departments, batches, time slots, and auto-generate conflict-free timetables powered by Graph Coloring & Backtracking algorithms.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to="/login"
            id="hero-login-btn"
            className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
          >
            Get Started Now <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold text-base px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all duration-200"
          >
            Explore Features
          </a>
        </div>

        {/* Quick Role Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-3xl">
          {[
            { role: 'Super Admin', desc: 'Structure & Users' },
            { role: 'HOD', desc: 'Timetable Generator' },
            { role: 'Faculty', desc: 'Personal Schedule' },
            { role: 'Student', desc: 'Class Timetable' },
            { role: 'Finance', desc: 'Fee Structure' },
          ].map((item) => (
            <div
              key={item.role}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center backdrop-blur-md hover:border-slate-700 transition-all"
            >
              <p className="text-xs font-bold text-slate-200">{item.role}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              System Highlights
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              Built for Speed, Accuracy, and Ease of Administration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">DSA Timetable Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses Max-Heap prioritization, Graph Coloring for hard collision constraints, and Backtracking solvers for automated zero-conflict scheduling.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Manual Overrides</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                HODs and Admins can override any cell in a draft schedule via modal selectors with real-time constraint validation and conflict indicators.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Puppeteer PDF Exports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate clean, print-ready Handlebars PDF documents for department timetables, complete with direct streaming and secure token authorization.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Academic Structure CRUD</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete management for Departments, Programs, Batches, Subjects (Lecture/Lab), Seating Capacity Rooms, and Weekly Time Slots.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bulk CSV User Import</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload student and faculty CSV spreadsheets with automatic parsing validation, error checks, and bulk user creation.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">JWT & RBAC Protection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Secure access with short-lived access tokens, refresh token cookies, silent re-authentication, and role-based route guards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-slate-400 font-medium">University ERP System Active</span>
        </div>
        <p>© 2026 University ERP. Built with React, Node.js, Mongoose & Custom DSA Engine.</p>
      </footer>
    </div>
  );
}
