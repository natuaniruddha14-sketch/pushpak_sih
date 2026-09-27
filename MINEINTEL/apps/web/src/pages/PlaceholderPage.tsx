import React from 'react';
import { BrainCircuit, BarChart3, FileSpreadsheet, Lock } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string; subtitle: string; icon: 'intelligence' | 'analytics' | 'reports' }> = ({
  title,
  subtitle,
  icon,
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'intelligence':
        return <BrainCircuit className="w-8 h-8 text-amber-700" />;
      case 'analytics':
        return <BarChart3 className="w-8 h-8 text-cyan-700" />;
      case 'reports':
        return <FileSpreadsheet className="w-8 h-8 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90">
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="glass-panel p-12 rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-blue-600 border border-slate-200/90 rounded-2xl">{renderIcon()}</div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-base font-bold text-white">{title} Workspace</h2>
          <p className="text-xs text-slate-400">
            This module is part of the CERA AI enterprise suite. Backend routes and schemas are ready for processing.
          </p>
        </div>
      </div>
    </div>
  );
};
