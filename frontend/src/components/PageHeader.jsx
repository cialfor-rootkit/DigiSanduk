import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-cyan/10 pb-6 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] brand-gold">DigiSanduk Console</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-haze">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
