import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@mineintel/shared-types';
import { Cpu, ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ANALYST);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123'); // Demo password for pre-seeded users
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-mining-900 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-2">
            <Cpu className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            MINEINTEL <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">AI PLATFORM</span>
          </h1>
          <p className="text-xs text-slate-400">Mining Document Intelligence & Reporting System</p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`py-2 text-xs font-medium rounded-lg transition ${
                !isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`py-2 text-xs font-medium rounded-lg transition ${
                isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field (Register mode) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@cmpdi.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
                />
              </div>
            </div>

            {/* Role Selection (Register mode) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Platform Role</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 transition appearance-none"
                  >
                    <option value={UserRole.ADMIN}>ADMIN (System Administrator)</option>
                    <option value={UserRole.ANALYST}>ANALYST (Mining Analyst)</option>
                    <option value={UserRole.GEOLOGIST}>GEOLOGIST (Coal Exploration Specialist)</option>
                    <option value={UserRole.MINING_ENGINEER}>MINING ENGINEER (Operations Engineer)</option>
                    <option value={UserRole.VIEWER}>VIEWER (Read-only Executive)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-mining-950 font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-seeded Login Accounts */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Accounts (Pre-seeded):</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@cmpdi.in')}
                className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-800 font-mono transition"
              >
                admin@cmpdi.in
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('geologist@cmpdi.in')}
                className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-800 font-mono transition"
              >
                geologist@cmpdi.in
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('engineer@cmpdi.in')}
                className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-800 font-mono transition"
              >
                engineer@cmpdi.in
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-mono">
          Protected by JWT Token Authentication & Bcrypt Hashing
        </p>

      </div>
    </div>
  );
};
