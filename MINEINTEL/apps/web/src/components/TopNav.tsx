import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Shield, 
  Menu,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const TopNav: React.FC<{ 
  onMenuToggle?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}> = ({ onMenuToggle, searchQuery = '', setSearchQuery }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const mockNotifications = [
    { id: '1', title: 'Document Processed', text: 'Rajmahal_BlockB_Report_2026.pdf indexed successfully', time: '10m ago' },
    { id: '2', title: 'New Mining Metrics', text: '5 structured coal seam records extracted', time: '1h ago' },
  ];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 lg:hidden transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search documents, coal seams, mine blocks, or metrics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
          />
        </div>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center space-x-3">
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl border border-slate-800 shadow-2xl py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <span className="text-[10px] font-mono text-amber-400">2 New</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-slate-900/50 transition space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase leading-none">
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 glass-panel rounded-2xl border border-slate-800 shadow-2xl py-2.5 z-50">
                <div className="px-4 py-2 border-b border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate font-mono">{user.email}</div>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Role: {user.role}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-2 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Org: CMPDI-HQ</span>
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>JWT Session Verified</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 px-2 pt-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 transition text-left"
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
