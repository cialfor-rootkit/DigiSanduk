import React from 'react';

const LoadingSpinner = ({ label = 'Loading' }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-haze">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
      {label}
    </div>
  );
};

export default LoadingSpinner;
