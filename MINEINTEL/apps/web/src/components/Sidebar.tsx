import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FolderKanban, 
  BrainCircuit, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Cpu,
  Layers,
  ChevronRight,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC<{ mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }> = ({
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'AI Intelligence', path: '/intelligence', icon: BrainCircuit },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Topic Taxonomy', path: '/topics', icon: BookOpen },
    { label: 'Data Quality & Audit', path: '/validation', icon: ShieldCheck },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-sm">MINEINTEL</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">CMPDI Mining Data AI</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Core Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen?.(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition group ${
                    isActive
                      ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 transition ${
                          isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Organization & System Info Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Organization</span>
              <span className="font-mono text-cyan-400 text-[10px]">CMPDI-HQ</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Role Access</span>
              <span className="font-mono text-amber-400 text-[10px] uppercase">
                {user?.role || 'ANALYST'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
