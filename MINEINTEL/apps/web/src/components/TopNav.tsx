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
    <header className="h-14 border-b border-slate-200/80 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 bg-slate-50 lg:hidden transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search documents, coal seams, mine blocks, or metrics..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center space-x-2.5">
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Notifications</span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">2 New</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-slate-50 transition space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{n.text}</p>
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
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 uppercase leading-tight font-medium">
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                      ROLE: {user.role}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-1.5 space-y-0.5 text-xs">
                  <div className="px-3 py-1.5 text-[11px] text-slate-600 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>ORG: CMPDI-HQ</span>
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-emerald-700 flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SESSION: VERIFIED</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-2 pt-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
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
