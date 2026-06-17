import React from 'react';
import { Cpu, Radio, Zap } from 'lucide-react';
import { WalletConnectButton } from './WalletConnectButton';

export const Header: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 holo-bg z-0" />
      <header className="relative z-10 border-b border-holo-cyan/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Cpu className="w-10 h-10 text-holo-cyan holo-float" />
                <div className="absolute -inset-2 bg-holo-cyan/20 rounded-full blur-lg" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold glitch" data-text="AI Explorer Assistant">
                  AI Explorer Assistant
                </h1>
                <p className="text-sm text-gray-400 font-mono">
                  GenLayer Studionet | AI Consensus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 text-holo-cyan">
                  <div className="w-2 h-2 bg-holo-green rounded-full animate-pulse" />
                  <span className="text-sm font-mono">System Online</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Radio className="w-4 h-4" />
                  <span className="text-sm">Studionet</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">AI Consensus</span>
                </div>
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
