import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
        404
      </div>
      <h1 className="text-white text-2xl font-bold mb-3">Page Not Found</h1>
      <p className="text-slate-400 text-sm mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        id="not-found-home-link"
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-500/30"
      >
        ← Return Home
      </Link>
    </div>
  );
}
