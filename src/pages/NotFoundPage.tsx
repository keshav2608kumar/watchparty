import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4 border border-brand-500/20">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404 — Screen Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The watch room or cinema page you're searching for seems to have disconnected from the stream.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-glow-sm transition"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/discover"
          className="px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-slate-300 font-semibold text-xs flex items-center gap-2 transition"
        >
          <Compass className="w-4 h-4 text-electric-blue" />
          <span>Browse Catalog</span>
        </Link>
      </div>
    </div>
  );
};
