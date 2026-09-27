import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@mineintel/shared-types';
import { Pickaxe, ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] text-slate-900 relative overflow-hidden w-full font-sans antialiased selection:bg-blue-600 selection:text-white px-4 py-8">
      {/* Ambient background glow effects matching landing page */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-amber-100/30 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-blue-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Back to landing page link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center z-10">
        <Link
          to="/landing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </Link>
        <span className="text-[11px] font-medium text-slate-400">Government Portal</span>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo + Branding */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mb-4 hover:scale-105 transition-transform">
          <Pickaxe className="w-6 h-6 text-amber-700" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
          CER<span className="text-blue-600">A</span>
        </h1>

        <div className="flex items-center gap-2 mt-1 mb-6">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold uppercase tracking-wider">
            Enterprise AI Platform
          </span>
        </div>

        {/* Clean White Card */}
        <div className="relative w-full rounded-3xl bg-white/90 backdrop-blur-md shadow-xl border border-slate-200/80 p-7 sm:p-8 flex flex-col transition-all">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                !isRegister
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                isRegister
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center space-x-2.5 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3.5">
            {/* Name Field (Register mode) */}
            {isRegister && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Role Selection (Register mode) */}
            {isRegister && (
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                >
                  <option value={UserRole.ADMIN}>ADMIN (System Administrator)</option>
                  <option value={UserRole.ANALYST}>ANALYST (Mining Analyst)</option>
                  <option value={UserRole.GEOLOGIST}>GEOLOGIST (Coal Exploration Specialist)</option>
                  <option value={UserRole.MINING_ENGINEER}>MINING ENGINEER (Operations Engineer)</option>
                  <option value={UserRole.VIEWER}>VIEWER (Read-only Executive)</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Demo Accounts</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@cmpdi.in')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded-full border border-slate-200/80 transition-all"
              >
                admin@cmpdi.in
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('geologist@cmpdi.in')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded-full border border-slate-200/80 transition-all"
              >
                geologist@cmpdi.in
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('engineer@cmpdi.in')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded-full border border-slate-200/80 transition-all"
              >
                engineer@cmpdi.in
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex flex-col items-center text-center space-y-1.5">
          <p className="text-slate-400 text-xs">
            Trusted by <span className="font-semibold text-slate-700">CMPDI & Coal India</span> exploration divisions
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Government Grade Security • DGMS Compliant
          </p>
        </div>
      </div>
    </div>
  );
};

