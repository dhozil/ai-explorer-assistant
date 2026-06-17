import React from 'react';

export const HoloLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="holo-loader" />
      <div className="mt-4 text-holo-cyan text-sm animate-pulse">
        Scanning blockchain data...
      </div>
    </div>
  );
};

export const HoloLoaderInline: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-holo-cyan/30 border-t-holo-cyan rounded-full animate-spin" />
      <span className="text-holo-cyan text-sm">Processing...</span>
    </div>
  );
};
