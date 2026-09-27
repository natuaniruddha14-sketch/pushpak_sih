import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Server, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Lock,
  Building
} from 'lucide-react';
import { HealthStatus } from '@mineintel/shared-types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null);
  const [aiHealth, setAiHealth] = useState<HealthStatus | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const checkHealth = async () => {
    setTestingHealth(true);
    try {
      const apiRes = await fetch('http://localhost:4000/health');
      if (apiRes.ok) {
        setApiHealth(await apiRes.json());
      }
    } catch (_e) {
      setApiHealth(null);
    }

    try {
      const aiRes = await fetch('http://localhost:8000/health');
      if (aiRes.ok) {
        setAiHealth(await aiRes.json());
      }
    } catch (_e) {
      setAiHealth(null);
    }
    setTestingHealth(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          Platform Settings & Health Diagnostics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profile credentials, organization tenancy, and runtime service health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Authenticated Profile</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Email Address</span>
              <span className="font-mono text-cyan-400">{user?.email}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Assigned Role</span>
              <span className="font-mono text-amber-400 font-bold uppercase">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <Building className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Organization Tenancy</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Organization Name</span>
              <span className="font-semibold text-white">Central Mine Planning & Design Institute</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Organization Code</span>
              <span className="font-mono text-cyan-400">CMPDI-HQ</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Security Policy</span>
              <span className="font-mono text-emerald-400">JWT Token Auth + Bcrypt</span>
            </div>
          </div>
        </div>

      </div>

      {/* Services Health */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Microservices & API Health Diagnostics
          </h2>
          <button
            onClick={checkHealth}
            disabled={testingHealth}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 rounded-lg transition"
          >
            {testingHealth ? 'Testing...' : 'Test Endpoints'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* API */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">API Backend (Node.js/Express)</span>
              {apiHealth ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>
            {apiHealth && (
              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <div>Port: 4000</div>
                <div>Service: {apiHealth.service}</div>
                <div>Version: {apiHealth.version}</div>
              </div>
            )}
          </div>

          {/* AI */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">AI Service (Python/FastAPI)</span>
              {aiHealth ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>
            {aiHealth && (
              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <div>Port: 8000</div>
                <div>Service: {aiHealth.service}</div>
                <div>Version: {aiHealth.version}</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
