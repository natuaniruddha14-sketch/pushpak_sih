import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Building, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { HealthStatus } from '@mineintel/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null);
  const [aiHealth, setAiHealth] = useState<HealthStatus | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const checkHealth = async () => {
    setTestingHealth(true);
    setErrorNotice(null);

    let apiErr = false;
    let aiErr = false;

    try {
      const apiRes = await fetch(`${API_URL}/health`);
      if (apiRes.ok) {
        setApiHealth(await apiRes.json());
      } else {
        setApiHealth(null);
        apiErr = true;
      }
    } catch (_e) {
      setApiHealth(null);
      apiErr = true;
    }

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/health`);
      if (aiRes.ok) {
        setAiHealth(await aiRes.json());
      } else {
        setAiHealth(null);
        aiErr = true;
      }
    } catch (_e) {
      setAiHealth(null);
      aiErr = true;
    }

    if (apiErr || aiErr) {
      setErrorNotice('One or more microservices appear unreachable. Verify backend server processes.');
    }

    setTestingHealth(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/90">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white border border-slate-200 text-blue-700 rounded">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">
            Platform Settings & Health Diagnostics
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage user profile credentials, organization tenancy, and runtime service health.
        </p>
      </div>

      {errorNotice && (
        <div className="p-3 bg-amber-50/40 border border-amber-200 text-amber-600 text-xs rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={checkHealth}
            className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded font-mono text-[11px] transition"
          >
            Retry Check
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Profile Card */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-2.5">
            <User className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold text-slate-900">Authenticated Profile</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-slate-800">{user?.name}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Email Address</span>
              <span className="font-mono text-blue-700">{user?.email}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Assigned Role</span>
              <span className="font-mono text-emerald-700 font-bold uppercase">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-2.5">
            <Building className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold text-slate-900">Organization Tenancy</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Organization Name</span>
              <span className="font-semibold text-slate-800">Central Mine Planning & Design Institute</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Organization Code</span>
              <span className="font-mono text-blue-700">CMPDI-HQ</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200/90">
              <span className="text-slate-400">Security Policy</span>
              <span className="font-mono text-emerald-700">JWT Token Auth + Bcrypt</span>
            </div>
          </div>
        </div>

      </div>

      {/* Services Health */}
      <div className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-2.5">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-blue-700" />
            Microservices & API Health Diagnostics
          </h2>
          <button
            onClick={checkHealth}
            disabled={testingHealth}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-500 border border-slate-200/90 text-xs font-medium text-slate-800 rounded transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${testingHealth ? 'animate-spin' : ''}`} />
            <span>{testingHealth ? 'Testing...' : 'Test Endpoints'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {/* API */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200/90 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">API Backend (Node.js/Express)</span>
              {apiHealth ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              ) : (
                <span className="text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1">
              <div>Target URL: {API_URL}</div>
              {apiHealth && (
                <>
                  <div>Service: {apiHealth.service}</div>
                  <div>Version: {apiHealth.version}</div>
                </>
              )}
            </div>
          </div>

          {/* AI */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200/90 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">AI Service (Python/FastAPI)</span>
              {aiHealth ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              ) : (
                <span className="text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1">
              <div>Target URL: {AI_SERVICE_URL}</div>
              {aiHealth && (
                <>
                  <div>Service: {aiHealth.service}</div>
                  <div>Version: {aiHealth.version}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
