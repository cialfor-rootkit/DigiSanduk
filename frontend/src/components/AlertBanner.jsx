import React from 'react';

const tones = {
  info: 'border-cyan/30 bg-cyan/10 text-cyan',
  warning: 'border-gold/40 bg-gold/10 text-gold',
  error: 'border-ember/40 bg-ember/10 text-ember'
};

const AlertBanner = ({ title, description, tone = 'info' }) => {
  const style = tones[tone] || tones.info;
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="text-xs text-haze mt-1">{description}</p>}
    </div>
  );
};

export default AlertBanner;
