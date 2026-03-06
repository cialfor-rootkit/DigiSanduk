import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppShell = () => {
  return (
    <div className="relative flex min-h-screen bg-void text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-cyan h-64 w-64 -left-20 top-24 opacity-60" />
        <div className="orb orb-neon h-72 w-72 right-[-40px] top-32 opacity-50" />
        <div className="orb orb-cyan h-48 w-48 left-[45%] bottom-[-40px] opacity-40" />
      </div>
      <Sidebar />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <Topbar />
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 opacity-40 grid-overlay" />
          <main className="relative flex-1 px-6 py-8 lg:px-10 animate-fade-up">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
