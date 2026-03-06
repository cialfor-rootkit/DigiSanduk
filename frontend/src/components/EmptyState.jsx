import React from 'react';

const EmptyState = ({ title = 'No data yet', description = 'Once activity appears, it will show up here.' }) => {
  return (
    <div className="rounded-2xl border border-cyan/10 bg-midnight/50 px-6 py-10 text-center text-sm text-haze">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs text-haze">{description}</p>
    </div>
  );
};

export default EmptyState;
