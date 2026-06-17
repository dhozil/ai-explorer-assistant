import React, { useState, useEffect, useRef } from 'react';
import type { WalletAnalysis, WalletComparison } from './types/database';
import { Header } from './components/Header';
import { WalletInput } from './components/WalletInput';
import { WalletAnalysisView } from './components/WalletAnalysisView';
import { WalletComparisonView } from './components/WalletComparison';
import { HoloLoader } from './components/LoadingSpinner';
import { HoloCard } from './components/HoloCard';
import { useWallet } from './lib/wallet';
import { WalletProvider } from './lib/wallet';
import {
  analyzeWalletWithGenLayer,
  compareWalletsWithGenLayer,
  subscribeToAnalysis,
  subscribeToComparison,
} from './lib/genlayer';
import { History, Activity, Scan, Database, Lock, Wallet } from 'lucide-react';

type ViewMode = 'single' | 'compare';

function AppContent() {
  const { address: walletAddress, isConnected } = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<WalletAnalysis | null>(null);
  const [comparison, setComparison] = useState<WalletComparison | null>(null);
  const [history, setHistory] = useState<{ address: string; score: number; date: string }[]>([]);
  const [consensusStatus, setConsensusStatus] = useState<string>('');

  // Realtime polling refs
  const unsubAnalysisRef = useRef<(() => void) | null>(null);
  const unsubComparisonRef = useRef<(() => void) | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      unsubAnalysisRef.current?.();
      unsubComparisonRef.current?.();
    };
  }, []);

  const handleAnalyze = async (address: string) => {
    if (!isConnected || !walletAddress) {
      return;
    }

    setLoading(true);
    setCurrentAddress(address);
    setConsensusStatus('Submitting transaction to GenLayer...');

    try {
      // Start realtime polling for this address
      unsubAnalysisRef.current?.();
      unsubAnalysisRef.current = subscribeToAnalysis(address, (updatedAnalysis) => {
        if (updatedAnalysis) {
          setCurrentAnalysis(updatedAnalysis);
          setConsensusStatus('');
          setLoading(false);

          // Update history
          setHistory(prev => [
            { address, score: updatedAnalysis.trust_score, date: new Date().toISOString() },
            ...prev.filter(h => h.address !== address).slice(0, 9),
          ]);
        }
      }, 3000);

      // Fire the write transaction
      await analyzeWalletWithGenLayer(address, walletAddress);
      setConsensusStatus('Transaction sent. Waiting for AI consensus...');
    } catch (error) {
      console.error('Analysis failed:', error);
      setConsensusStatus('Analysis failed — try again');
      setLoading(false);
    }
  };

  const handleCompare = async (addresses: string[]) => {
    if (!isConnected || !walletAddress) {
      return;
    }

    setLoading(true);
    setViewMode('compare');
    setConsensusStatus('Submitting comparison to GenLayer AI consensus...');

    try {
      // Start realtime polling for comparisons
      unsubComparisonRef.current?.();
      unsubComparisonRef.current = subscribeToComparison((updatedComparison) => {
        if (updatedComparison) {
          setComparison(updatedComparison);
          setConsensusStatus('');
          setLoading(false);
        }
      }, 3000);

      // Fire the initial comparison transaction
      await compareWalletsWithGenLayer(addresses, walletAddress);
      setConsensusStatus('Comparison sent. Waiting for AI consensus...');
    } catch (error) {
      console.error('Comparison failed:', error);
      setConsensusStatus('Comparison failed — try again');
      setLoading(false);
    }
  };

  const resetView = () => {
    setViewMode('single');
    setCurrentAddress(null);
    setCurrentAnalysis(null);
    setComparison(null);
    setComparisonAnalyses({});
    setConsensusStatus('');
    setLoading(false);

    // Stop polling
    unsubAnalysisRef.current?.();
    unsubComparisonRef.current?.();
  };

  return (
    <div className="min-h-screen bg-holo-dark text-white">
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Wallet connection warning */}
        {!isConnected && (
          <HoloCard className="mb-8 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Lock className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-500">Wallet Connection Required</h3>
                  <p className="text-gray-400">Connect your MetaMask wallet to use AI analysis features on GenLayer Studionet</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Wallet className="w-5 h-5" />
                <span className="font-mono text-sm">Click "Connect Wallet" above</span>
              </div>
            </div>
          </HoloCard>
        )}

        {/* Consensus status indicator */}
        {consensusStatus && (
          <HoloCard className="mb-6 border-holo-cyan/50 bg-holo-cyan/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-holo-cyan rounded-full animate-pulse" />
              <span className="text-holo-cyan font-mono text-sm">{consensusStatus}</span>
            </div>
          </HoloCard>
        )}

        <div className="mb-8">
          {viewMode === 'compare' && comparison && (
            <div className="mb-6">
              <button
                onClick={resetView}
                className="text-holo-cyan hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back to Analysis
              </button>
            </div>
          )}
          <WalletInput
            onSubmit={handleAnalyze}
            onCompare={handleCompare}
            loading={loading}
            disabled={!isConnected}
          />
        </div>

        {loading && <HoloLoader />}

        {!loading && viewMode === 'single' && currentAddress && currentAnalysis && (
          <WalletAnalysisView address={currentAddress} analysis={currentAnalysis} />
        )}

        {!loading && viewMode === 'single' && currentAddress && !currentAnalysis && consensusStatus && (
          <HoloCard className="text-center py-12">
            <div className="text-holo-cyan text-lg mb-2">{consensusStatus}</div>
            <div className="text-gray-400 text-sm">Waiting for AI consensus from GenLayer network...</div>
          </HoloCard>
        )}

        {!loading && viewMode === 'compare' && comparison && (
          <WalletComparisonView
            comparison={comparison}
          />
        )}

        {!loading && viewMode === 'compare' && !comparison && consensusStatus && (
          <HoloCard className="text-center py-12">
            <div className="text-holo-cyan text-lg mb-2">{consensusStatus}</div>
            <div className="text-gray-400 text-sm">Waiting for AI consensus from GenLayer network...</div>
          </HoloCard>
        )}

        {!loading && !currentAddress && !currentAnalysis && !comparison && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <FeatureCard
                icon={<Scan className="w-8 h-8" />}
                title="Blockchain Analysis"
                description="Real-time scanning of wallet transactions and on-chain behavior patterns"
                disabled={!isConnected}
              />
              <FeatureCard
                icon={<Activity className="w-8 h-8" />}
                title="AI Trust Scoring"
                description="GenLayer Intelligent Contract consensus-based trust assessment"
                disabled={!isConnected}
              />
              <FeatureCard
                icon={<Database className="w-8 h-8" />}
                title="Consensus Comparison"
                description="Compare wallets with AI validator consensus for trust verification"
                disabled={!isConnected}
              />
            </div>

            {history.length > 0 && (
              <HoloCard className="mb-8">
                <h3 className="text-lg font-semibold holo-text mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" /> Recent Analyses
                </h3>
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.address}
                      onClick={() => isConnected && handleAnalyze(item.address)}
                      disabled={!isConnected}
                      className={`w-full flex items-center justify-between p-3 rounded-lg bg-black/30 border border-holo-cyan/20 hover:border-holo-cyan/50 transition-colors ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-mono text-sm text-gray-400">
                        {item.address.slice(0, 10)}...{item.address.slice(-8)}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-holo-cyan font-bold">
                          {item.score.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </HoloCard>
            )}

            <HoloCard className="text-center py-12">
              <div className="text-6xl font-bold glitch mb-4" data-text={isConnected ? "Enter a wallet address to begin" : "Connect wallet to begin"}>
                {isConnected ? 'Enter a wallet address to begin' : 'Connect wallet to begin'}
              </div>
              <p className="text-gray-400 max-w-md mx-auto">
                {isConnected
                  ? 'Input an Ethereum address to analyze trust scores via GenLayer AI Consensus.'
                  : 'Connect your MetaMask wallet to analyze wallets using GenLayer Intelligent Contracts.'}
              </p>
              {isConnected && (
                <div className="mt-4 flex items-center justify-center gap-2 text-holo-green text-sm">
                  <div className="w-2 h-2 bg-holo-green rounded-full animate-pulse" />
                  <span className="font-mono">Connected to GenLayer Studionet</span>
                </div>
              )}
            </HoloCard>
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-holo-cyan/20 mt-12 py-6 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-mono">AI Explorer Assistant v1.0 | GenLayer Studionet | Contract: 0x888F...9aa0</p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}> = ({ icon, title, description, disabled }) => (
  <HoloCard className={`text-center holo-float ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex justify-center mb-4">
      <div className="text-holo-cyan">{icon}</div>
    </div>
    <h3 className="text-xl font-bold holo-text mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </HoloCard>
);

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
