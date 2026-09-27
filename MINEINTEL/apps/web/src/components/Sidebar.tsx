import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FolderKanban, 
  BrainCircuit, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Pickaxe,
  Layers,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  Globe
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
          className="fixed inset-0 bg-blue-600/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center space-x-3 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Pickaxe className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-sm">
                CER<span className="text-blue-600">A</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">CMPDI Enterprise</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1.5 pt-0.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            System Modules
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
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 transition ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Landing Page Link & Organization Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <Link
            to="/landing"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Public Overview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-sans">
              <span className="text-slate-400 font-medium">Subsidiary</span>
              <span className="text-slate-800 font-bold">CMPDI / CIL</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-sans">
              <span className="text-slate-400 font-medium">Clearance</span>
              <span className="text-blue-700 font-bold uppercase">
                {user?.role || 'ANALYST'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

