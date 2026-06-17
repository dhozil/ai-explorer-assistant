import React, { useState } from 'react';
import { Wallet, Plus, X } from 'lucide-react';
import { formatAddress } from '../lib/utils';

interface WalletInputProps {
  onSubmit: (address: string) => void;
  onCompare: (addresses: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const WalletInput: React.FC<WalletInputProps> = ({
  onSubmit,
  onCompare,
  loading = false,
  disabled = false
}) => {
  const [address, setAddress] = useState('');
  const [compareAddresses, setCompareAddresses] = useState<string[]>([]);
  const [showCompareMode, setShowCompareMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSubmit(address.trim());
      setAddress('');
    }
  };

  const addToCompare = (addr: string) => {
    if (addr.trim() && !compareAddresses.includes(addr.trim()) && compareAddresses.length < 5) {
      setCompareAddresses([...compareAddresses, addr.trim()]);
      setAddress('');
    }
  };

  const removeFromCompare = (addr: string) => {
    setCompareAddresses(compareAddresses.filter(a => a !== addr));
  };

  const handleCompare = () => {
    if (compareAddresses.length >= 2) {
      onCompare(compareAddresses);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowCompareMode(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !showCompareMode
              ? 'bg-gradient-to-r from-holo-cyan to-holo-blue text-holo-dark'
              : 'text-holo-cyan border border-holo-cyan/30 hover:border-holo-cyan'
          }`}
        >
          Single Analysis
        </button>
        <button
          onClick={() => setShowCompareMode(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            showCompareMode
              ? 'bg-gradient-to-r from-holo-cyan to-holo-blue text-holo-dark'
              : 'text-holo-cyan border border-holo-cyan/30 hover:border-holo-cyan'
          }`}
        >
          Compare Mode
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-holo-cyan/50 w-5 h-5" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={disabled ? "Connect wallet first..." : showCompareMode ? "Enter wallet address to compare..." : "Enter wallet address (e.g., 0x...)"}
            disabled={disabled}
            className="w-full hollo-input pl-12 pr-4 py-4 bg-black/50 border border-holo-cyan/30 rounded-lg text-holo-cyan placeholder:text-holo-cyan/50 focus:border-holo-cyan focus:shadow-[0_0_20px_rgba(0,245,255,0.3)] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {showCompareMode ? (
          <button
            type="button"
            onClick={() => addToCompare(address)}
            disabled={disabled || !address.trim() || compareAddresses.includes(address.trim()) || compareAddresses.length >= 5}
            className="holo-btn px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !address.trim() || loading}
            className="holo-btn holo-btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
      </form>

      {showCompareMode && compareAddresses.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {compareAddresses.map((addr) => (
              <div
                key={addr}
                className="flex items-center gap-2 bg-holo-cyan/10 border border-holo-cyan/30 rounded-lg px-3 py-2"
              >
                <span className="text-holo-cyan text-sm font-mono">
                  {formatAddress(addr)}
                </span>
                <button
                  onClick={() => removeFromCompare(addr)}
                  className="text-holo-cyan/70 hover:text-holo-magenta transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCompare}
              disabled={disabled || compareAddresses.length < 2 || loading}
              className="holo-btn holo-btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Comparing...' : `Compare ${compareAddresses.length} Wallets`}
            </button>
            {compareAddresses.length < 2 && (
              <span className="text-holo-orange text-sm">
                Add at least 2 wallets to compare
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
