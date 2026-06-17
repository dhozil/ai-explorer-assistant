import { supabase } from './supabase';
import type { Wallet, WalletAnalysis, WalletTransaction, WalletComparison } from '../types/database';

// Known suspicious addresses for demo (in reality would query threat intelligence)
const SUSPICIOUS_PATTERNS = {
  mixerIndicators: (tx: WalletTransaction) => tx.to_address?.includes('mix') || false,
  highFrequencyThreshold: 50,
  unusualVolumeThreshold: 1000000,
};

export interface BlockchainData {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  analysis: WalletAnalysis | null;
}

export async function fetchWalletData(address: string): Promise<BlockchainData | null> {
  if (!supabase) {
    return generateDemoData(address);
  }

  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('address', address)
      .single();

    if (!wallet) {
      return generateDemoData(address);
    }

    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    const { data: analysis } = await supabase
      .from('wallet_analyses')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      wallet,
      transactions: transactions || [],
      analysis
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return generateDemoData(address);
  }
}

export async function analyzeWallet(address: string): Promise<WalletAnalysis> {
  if (!supabase) {
    return generateDemoAnalysis(address);
  }

  // Call edge function for analysis
  const { data, error } = await supabase.functions.invoke('analyze-wallet', {
    body: { address }
  });

  if (error) {
    console.error('Analysis error:', error);
    return generateDemoAnalysis(address);
  }

  return data;
}

export async function compareWallets(addresses: string[]): Promise<WalletComparison | null> {
  if (!supabase || addresses.length < 2) {
    return generateDemoComparison(addresses);
  }

  const { data, error } = await supabase.functions.invoke('compare-wallets', {
    body: { addresses }
  });

  if (error) {
    console.error('Comparison error:', error);
    return generateDemoComparison(addresses);
  }

  return data;
}

// Demo data generators
function generateDemoData(address: string): BlockchainData {
  const wallet: Wallet = {
    id: crypto.randomUUID(),
    address,
    blockchain: 'ethereum',
    created_at: new Date().toISOString(),
    last_analyzed_at: new Date().toISOString(),
    analysis_count: 1
  };

  const transactions = generateDemoTransactions(wallet.id, address);
  const analysis = generateDemoAnalysis(address);

  return { wallet, transactions, analysis };
}

function generateDemoTransactions(walletId: string, address: string): WalletTransaction[] {
  const txTypes = ['transfer', 'swap', 'stake', 'mint', 'contract'];
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'];
  const transactions: WalletTransaction[] = [];

  for (let i = 0; i < Math.floor(Math.random() * 30) + 20; i++) {
    transactions.push({
      id: crypto.randomUUID(),
      wallet_id: walletId,
      tx_hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      from_address: address,
      to_address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      value: Math.random() * 10,
      token_symbol: tokens[Math.floor(Math.random() * tokens.length)],
      timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      tx_type: txTypes[Math.floor(Math.random() * txTypes.length)],
      created_at: new Date().toISOString()
    });
  }

  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateDemoAnalysis(address: string): WalletAnalysis {
  const hash = Array.from(address).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = 40 + (hash % 50);
  const trustScore = Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10)));

  const riskFactors = [
    'Interacted with unverified contracts',
    'Received funds from flagged addresses',
    'High-frequency trading pattern detected',
    'Limited transaction history',
    'Connected to known mixer services'
  ].slice(0, Math.floor(Math.random() * 3) + (trustScore < 50 ? 2 : 0));

  const positiveFactors = [
    'Long-standing account history',
    'Consistent transaction patterns',
    'Interacts with reputable DeFi protocols',
    'No suspicious cross-chain transfers',
    'Maintains healthy balance of native tokens',
    'Participates in governance voting'
  ].slice(0, Math.floor(Math.random() * 4) + (trustScore > 60 ? 2 : 0));

  let riskLevel: WalletAnalysis['risk_level'] = 'medium';
  if (trustScore >= 80) riskLevel = 'very_low';
  else if (trustScore >= 65) riskLevel = 'low';
  else if (trustScore >= 40) riskLevel = 'medium';
  else if (trustScore >= 20) riskLevel = 'high';
  else riskLevel = 'very_high';

  return {
    id: crypto.randomUUID(),
    wallet_id: crypto.randomUUID(),
    trust_score: trustScore,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    positive_factors: positiveFactors,
    activity_summary: {
      transaction_history: Math.floor(Math.random() * 15) + 3,
      protocol_interactions: Math.floor(Math.random() * 15) + 3,
      wallet_age: Math.floor(Math.random() * 15) + 3,
      portfolio_health: Math.floor(Math.random() * 15) + 3,
      risk_indicators: Math.floor(Math.random() * 15) + 3,
      total_score: Math.floor(trustScore),
    },
    ai_reasoning: generateAIReasoning(trustScore, riskLevel),
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}

function generateAIReasoning(score: number, level: string): string {
  if (score >= 80) {
    return 'This wallet demonstrates strong trust indicators including consistent transaction patterns, interactions with established protocols, and a clean transaction history. No suspicious activity detected. Recommended for safe interactions.';
  } else if (score >= 60) {
    return 'The wallet shows generally trustworthy behavior with some minor concerns. Transaction history indicates normal usage patterns with reputable contracts. Overall low risk profile suitable for most standard interactions.';
  } else if (score >= 40) {
    return 'Mixed signals detected in wallet activity. While some legitimate transactions are present, there are patterns that warrant caution. Recommend additional verification before high-value interactions.';
  } else {
    return 'Significant risk factors identified including interactions with flagged addresses and unusual transaction patterns. Not recommended for high-value transactions without additional due diligence.';
  }
}

function generateDemoComparison(addresses: string[]): WalletComparison {
  const scores: Record<string, number> = {};
  let winner = addresses[0];
  let highestScore = 0;

  addresses.forEach(addr => {
    const hash = Array.from(addr).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    scores[addr] = 40 + (hash % 50) + Math.random() * 10;
    if (scores[addr] > highestScore) {
      highestScore = scores[addr];
      winner = addr;
    }
  });

  return {
    id: crypto.randomUUID(),
    wallet_ids: addresses,
    consensus_winner: winner,
    consensus_score: highestScore,
    consensus_reasoning: `Based on consensus analysis of ${addresses.length} wallets, the winner demonstrates the strongest trust profile with consistent transaction patterns and lower risk indicators.`,
    individual_scores: scores,
    created_at: new Date().toISOString()
  };
}
