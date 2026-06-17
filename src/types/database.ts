export interface Wallet {
  id: string;
  address: string;
  blockchain: string;
  created_at: string;
  last_analyzed_at: string | null;
  analysis_count: number;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  from_address: string;
  to_address: string | null;
  value: number;
  token_symbol: string;
  timestamp: string;
  tx_type: string;
  created_at: string;
}

export interface WalletAnalysis {
  id: string;
  wallet_id: string;
  trust_score: number;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  risk_factors: string[];
  positive_factors: string[];
  activity_summary: ActivitySummary;
  ai_reasoning: string;
  analyzed_at: string;
  created_at: string;
}

export interface ActivitySummary {
  transaction_history: number;
  protocol_interactions: number;
  wallet_age: number;
  portfolio_health: number;
  risk_indicators: number;
  total_score: number;
}

export interface WalletComparison {
  id: string;
  wallet_ids: string[];
  consensus_winner: string | null;
  consensus_score: number;
  consensus_reasoning: string;
  individual_scores: Record<string, number>;
  wallet_details: Record<string, {
    trust_score: number;
    risk_level: string;
    scores: { transaction_history: number; protocol_interactions: number; wallet_age: number; portfolio_health: number; risk_indicators: number };
    risk_factors: string[];
    positive_factors: string[];
    reasoning: string;
  }>;
  created_at: string;
}
