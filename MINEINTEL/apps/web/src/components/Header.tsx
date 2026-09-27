import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, LogOut, User, Shield, ChevronDown, Activity } from 'lucide-react';

export const Header: React.FC<{ onRefreshHealth?: () => void; loadingHealth?: boolean }> = ({
  onRefreshHealth,
  loadingHealth,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/90 bg-mining-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left Branding */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            CERA <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">AI PLATFORM</span>
          </h1>
          <p className="text-xs text-slate-400">CMPDI / CIL Mining Document Intelligence</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {onRefreshHealth && (
          <button
            onClick={onRefreshHealth}
            disabled={loadingHealth}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition"
          >
            <Activity className={`w-3.5 h-3.5 text-amber-700 ${loadingHealth ? 'animate-spin' : ''}`} />
            <span>Health Check</span>
          </button>
        )}

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-slate-950/80 hover:bg-blue-500 border border-slate-200/90 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 border border-amber-500/30 flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <span>{user.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{user.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl border border-slate-200/90 shadow-2xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-200">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate font-mono">{user.email}</div>
                  <div className="mt-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-1.5">
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">Org: CMPDI-HQ</span>
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>JWT Verified Session</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-2 pt-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-xs text-rose-700 hover:bg-rose-500/10 rounded-lg flex items-center space-x-2 transition text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
