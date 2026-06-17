import React from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import type { WalletAnalysis } from '../types/database';
import { ScoreRing } from './ScoreRing';
import { HoloCard, HoloSection } from './HoloCard';
import { getRiskColor } from '../lib/utils';

interface WalletAnalysisViewProps {
  address: string;
  analysis: WalletAnalysis;
}

export const WalletAnalysisView: React.FC<WalletAnalysisViewProps> = ({
  address,
  analysis
}) => {
  const { trust_score, risk_level, risk_factors, positive_factors, activity_summary, ai_reasoning } = analysis;

  return (
    <div className="space-y-6">
      <HoloCard showScan>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center">
            <ScoreRing score={trust_score} size={200} />
            <div className="mt-4 text-center">
              <div className={`${getRiskColor(risk_level)} text-2xl font-bold`}>
                {risk_level.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-gray-400 text-sm mt-1">Risk Level</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold holo-text mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Wallet Address
            </h3>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-holo-cyan text-sm break-all border border-holo-cyan/20">
              {address}
            </div>

            <h4 className="text-lg font-semibold holo-text mt-6 mb-4">AI Reasoning</h4>
            <div className="bg-black/30 rounded-lg p-4 border border-holo-cyan/20">
              {ai_reasoning}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4 border border-holo-green/30">
                <div className="text-holo-green text-2xl font-bold font-mono">
                  {positive_factors.length}
                </div>
                <div className="text-gray-400 text-sm">Trust Factors</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-holo-magenta/30">
                <div className="text-holo-magenta text-2xl font-bold font-mono">
                  {risk_factors.length}
                </div>
                <div className="text-gray-400 text-sm">Risk Factors</div>
              </div>
            </div>
          </div>
        </div>
      </HoloCard>

      <div className="grid md:grid-cols-2 gap-6">
        {positive_factors.length > 0 && (
          <HoloSection title="Trust Indicators" icon={<CheckCircle className="w-5 h-5 text-holo-green" />}>
            <ul className="space-y-2">
              {positive_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-holo-green mt-0.5">+</span>
                  <span className="text-gray-300">{factor}</span>
                </li>
              ))}
            </ul>
          </HoloSection>
        )}

        {risk_factors.length > 0 && (
          <HoloSection title="Risk Factors" icon={<AlertTriangle className="w-5 h-5 text-holo-orange" />}>
            <ul className="space-y-2">
              {risk_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-holo-orange mt-0.5">!</span>
                  <span className="text-gray-300">{factor}</span>
                </li>
              ))}
            </ul>
          </HoloSection>
        )}
      </div>

      <HoloSection title="Dimension Scores" icon={<Activity className="w-5 h-5 text-holo-cyan" />}>
        <div className="space-y-3">
          {[
            { label: 'Transaction History', score: activity_summary.transaction_history, max: 20 },
            { label: 'Protocol Interactions', score: activity_summary.protocol_interactions, max: 20 },
            { label: 'Wallet Age', score: activity_summary.wallet_age, max: 20 },
            { label: 'Portfolio Health', score: activity_summary.portfolio_health, max: 20 },
            { label: 'Risk Indicators', score: activity_summary.risk_indicators, max: 20 },
          ].map((dim) => (
            <div key={dim.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{dim.label}</span>
                <span className="text-holo-cyan font-mono">{dim.score}/{dim.max}</span>
              </div>
              <div className="activity-bar">
                <div
                  className="activity-bar-fill"
                  style={{ width: `${(dim.score / dim.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </HoloSection>
    </div>
  );
};
