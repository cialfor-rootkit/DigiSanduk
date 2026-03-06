import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-neon h-64 w-64 -left-24 top-6 opacity-60" />
        <div className="orb orb-cyan h-72 w-72 right-[-60px] bottom-10 opacity-50" />
      </div>
      <div className="relative z-10 hidden flex-col justify-between bg-midnight/80 p-10 md:flex">
        <div>
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="DigiSanduk" className="h-24 w-24 rounded-3xl border border-gold/40 shadow-glow" />
            <p className="text-xs uppercase tracking-[0.5em] brand-gold">DigiSanduk</p>
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
            Secure data sharing built for modern cyber operations.
          </h1>
          <p className="mt-4 text-sm text-haze">
            Coordinate threat intel, approvals, and audit trails across organizations with zero trust rigor.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan/10 bg-carbon/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-haze">Platform Highlights</p>
          <ul className="mt-4 space-y-3 text-sm text-white">
            <li>Policy-based sharing workflows</li>
            <li>End-to-end encrypted payloads</li>
            <li>Immutable audit logging</li>
          </ul>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md animate-fade-up-delay">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
