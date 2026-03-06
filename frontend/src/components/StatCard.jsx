import React from 'react';

const toneClasses = {
  cyan: 'from-cyan/30 via-cyan/10 to-transparent',
  neon: 'from-neon/30 via-neon/10 to-transparent',
  gold: 'from-gold/30 via-gold/10 to-transparent',
  ember: 'from-ember/30 via-ember/10 to-transparent'
};

const StatCard = ({ label, value, detail, tone = 'cyan' }) => {
  return (
    <div className="glass-panel hover-lift pulse-glow relative overflow-hidden rounded-2xl p-5">
      <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${toneClasses[tone] || toneClasses.cyan}`} />
      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-haze">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        {detail && <p className="mt-2 text-xs text-haze">{detail}</p>}
      </div>
    </div>
  );
};

export default StatCard;
