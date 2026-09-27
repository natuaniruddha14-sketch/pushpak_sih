import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet context={{ globalSearch }} />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400 font-sans">
          CERA AI — Enterprise Mining Document Intelligence & Reporting Platform • CMPDI / CIL
        </footer>
      </div>
    </div>
  );
};

