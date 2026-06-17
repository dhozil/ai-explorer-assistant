import React from 'react';
import {
  Trophy,
  BarChart3,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import type { WalletComparison } from '../types/database';
import { ScoreRing } from './ScoreRing';
import { HoloCard, HoloSection } from './HoloCard';
import { getRiskColor } from '../lib/utils';

interface WalletComparisonViewProps {
  comparison: WalletComparison;
}

export const WalletComparisonView: React.FC<WalletComparisonViewProps> = ({
  comparison
}) => {
  const { consensus_winner, consensus_score, consensus_reasoning, individual_scores, wallet_details } = comparison;

  const sortedAddresses = Object.entries(individual_scores)
    .sort(([, a], [, b]) => b - a);

  const getDetails = (addr: string) => wallet_details?.[addr] || null;

  return (
    <div className="space-y-6">
      <HoloCard showScan className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Trophy className="w-16 h-16 text-holo-green" />
            <div className="absolute inset-0 animate-ping">
              <Trophy className="w-16 h-16 text-holo-green opacity-30" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold holo-text mb-2">Consensus Winner</h2>
        <div className="bg-black/30 rounded-lg p-4 border border-holo-green/50 max-w-lg mx-auto">
          <div className="font-mono text-holo-green text-lg mb-2">
            {consensus_winner}
          </div>
          <div className="text-3xl font-bold text-holo-green">
            {consensus_score.toFixed(1)}
          </div>
          <div className="text-gray-400 text-sm">Highest Trust Score</div>
        </div>
      </HoloCard>

      <HoloSection title="Consensus Reasoning" icon={<BarChart3 className="w-5 h-5 text-holo-cyan" />}>
        <div className="bg-black/30 rounded-lg p-6 border border-holo-cyan/20">
          <p className="text-gray-300 leading-relaxed">{consensus_reasoning}</p>
        </div>
      </HoloSection>

      <HoloSection title="Detailed Comparison" icon={<Target className="w-5 h-5 text-holo-cyan" />}>
        <div className="space-y-6">
          {sortedAddresses.map(([address, score], index) => {
            const details = getDetails(address);
            const isWinner = address === consensus_winner;

            return (
              <div
                key={address}
                className={`holo-card p-6 ${isWinner ? 'border-holo-green ring-1 ring-holo-green/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <span className="bg-holo-green text-holo-dark px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> #1 WINNER
                      </span>
                    )}
                    {index === 1 && sortedAddresses.length > 1 && (
                      <span className="bg-holo-cyan text-holo-dark px-2 py-1 rounded text-xs font-bold">
                        #2
                      </span>
                    )}
                    {index === 2 && sortedAddresses.length > 2 && (
                      <span className="bg-holo-orange text-holo-dark px-2 py-1 rounded text-xs font-bold">
                        #3
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-sm text-gray-400">
                    {address}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center">
                    <ScoreRing score={score} size={140} />
                    {details && (
                      <div className="mt-3 text-center">
                        <div className={`${getRiskColor(details.risk_level)} text-lg font-bold`}>
                          {details.risk_level.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-gray-400 text-sm">Risk Level</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {details && (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> AI Reasoning
                          </h4>
                          <div className="bg-black/30 rounded-lg p-3 border border-holo-cyan/20 text-sm text-gray-300">
                            {details.reasoning}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/30 rounded-lg p-3 border border-holo-green/30">
                            <div className="text-holo-green text-xl font-bold font-mono">
                              {details.positive_factors?.length || 0}
                            </div>
                            <div className="text-gray-400 text-xs">Trust Factors</div>
                          </div>
                          <div className="bg-black/30 rounded-lg p-3 border border-holo-magenta/30">
                            <div className="text-holo-magenta text-xl font-bold font-mono">
                              {details.risk_factors?.length || 0}
                            </div>
                            <div className="text-gray-400 text-xs">Risk Factors</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {details && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {details.positive_factors && details.positive_factors.length > 0 && (
                      <div className="bg-black/20 rounded-lg p-3 border border-holo-green/20">
                        <h5 className="text-xs font-semibold text-holo-green mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Trust Indicators
                        </h5>
                        <ul className="space-y-1">
                          {details.positive_factors.map((f, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-holo-green">+</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {details.risk_factors && details.risk_factors.length > 0 && (
                      <div className="bg-black/20 rounded-lg p-3 border border-holo-magenta/20">
                        <h5 className="text-xs font-semibold text-holo-orange mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Risk Factors
                        </h5>
                        <ul className="space-y-1">
                          {details.risk_factors.map((f, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-holo-orange">!</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {details && details.scores && (
                  <div className="mt-4">
                    <h5 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Dimension Scores
                    </h5>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: 'TX History', score: details.scores.transaction_history },
                        { label: 'Protocols', score: details.scores.protocol_interactions },
                        { label: 'Age', score: details.scores.wallet_age },
                        { label: 'Portfolio', score: details.scores.portfolio_health },
                        { label: 'Risk', score: details.scores.risk_indicators },
                      ].map((dim) => (
                        <div key={dim.label} className="text-center">
                          <div className="text-holo-cyan font-mono text-sm font-bold">{dim.score}/20</div>
                          <div className="text-gray-500 text-[10px]">{dim.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </HoloSection>

      <HoloCard className="p-6">
        <h3 className="text-lg font-semibold holo-text mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {sortedAddresses.map(([address, score]) => (
            <div key={address} className="flex items-center gap-4">
              <div className="font-mono text-sm text-gray-400 w-32 truncate">
                {address}
              </div>
              <div className="flex-1 activity-bar">
                <div
                  className="activity-bar-fill holo-float"
                  style={{
                    width: `${(score as number) / 100 * 100}%`,
                    background: address === consensus_winner
                      ? 'linear-gradient(90deg, var(--holo-cyan), var(--holo-green))'
                      : 'linear-gradient(90deg, var(--holo-cyan), var(--holo-blue))'
                  }}
                />
              </div>
              <div className="w-16 text-right font-mono text-holo-cyan">
                {typeof score === 'number' ? score.toFixed(1) : score}
              </div>
            </div>
          ))}
        </div>
      </HoloCard>
    </div>
  );
};
