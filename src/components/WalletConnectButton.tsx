import React from 'react';
import { useWallet } from '../lib/wallet';
import { Wallet, LogOut, AlertCircle, Loader } from 'lucide-react';

export function WalletConnectButton() {
  const {
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  } = useWallet();

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-holo-cyan/20 border border-holo-cyan/50 text-holo-cyan cursor-wait"
      >
        <Loader className="w-5 h-5 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-holo-cyan/20 border border-holo-cyan/50">
          <Wallet className="w-5 h-5 text-holo-cyan" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={connect}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-holo-cyan/80 to-holo-purple/80 border border-holo-cyan/50 hover:from-holo-cyan hover:to-holo-purple transition-all font-semibold text-white shadow-lg shadow-holo-cyan/20"
      >
        <Wallet className="w-5 h-5" />
        <span>Connect Wallet</span>
      </button>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
