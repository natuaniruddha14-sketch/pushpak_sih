import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-mining-900 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 animate-pulse">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="text-sm font-mono text-slate-400">Authenticating MINEINTEL Session...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
