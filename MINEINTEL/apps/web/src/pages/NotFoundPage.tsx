import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-700">
        <AlertTriangle className="w-12 h-12" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-slate-400">
          The requested geological intelligence module or route does not exist or has been moved.
        </p>
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <Link
          to="/"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition shadow-lg"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
