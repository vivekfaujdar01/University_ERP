import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LandingPage — University ERP splash page shown at route "/".
 * This serves as the app shell demo for T1.
 * A full authenticated layout will be built in T2.
 */
export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Skip to content — accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-base">U</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">
            University ERP
          </span>
        </div>
        <Link
          to="/login"
          id="header-login-btn"
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors duration-150 shadow-lg shadow-blue-500/20"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 page-enter"
      >
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Production-Grade University Management
        </span>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mb-6">
          Smarter Campus.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Powered by Intelligence.
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          A complete ERP system for academics, attendance, fees, exams, and
          intelligent timetable scheduling — all in one platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            id="hero-login-btn"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
          >
            Get Started →
          </Link>
          <a
            href="#modules"
            id="hero-learn-more"
            className="text-slate-400 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-150"
          >
            Learn More
          </a>
        </div>
      </main>

      {/* Modules Grid */}
      <section id="modules" className="px-8 pb-20 max-w-5xl mx-auto w-full">
        <h2 className="text-center text-white/50 text-sm font-medium uppercase tracking-widest mb-8">
          Core Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📅', label: 'Timetable', desc: 'DSA-powered scheduling' },
            { icon: '✅', label: 'Attendance', desc: 'Auto-alerts at 75%' },
            { icon: '💳', label: 'Fees', desc: 'Razorpay + offline' },
            { icon: '📝', label: 'Exams', desc: 'Hall tickets + GPA' },
          ].map((mod) => (
            <div
              key={mod.label}
              className="glass rounded-xl p-5 text-center hover:scale-105 transition-transform duration-200"
            >
              <div className="text-3xl mb-2">{mod.icon}</div>
              <div className="text-white font-semibold text-sm">{mod.label}</div>
              <div className="text-slate-400 text-xs mt-1">{mod.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-6 text-slate-600 text-sm">
        © 2025 University ERP. Built with MERN + DSA.
      </footer>
    </div>
  );
}
