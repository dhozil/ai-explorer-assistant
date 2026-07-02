import { createClient as genlayerCreateClient, chains } from 'genlayer-js';
import type { WalletAnalysis, WalletComparison } from '../types/database';

// ── GenLayer Configuration ────────────────────────────────────────────────────

const STUDIONET_CHAIN_ID_HEX = '0xF22F';
const STUDIONET_RPC = 'https://studio.genlayer.com/api';
const STUDIONET_NAME = 'GenLayer Studio';
const DEFAULT_CONTRACT_ADDRESS = '0x888F953c2F0D3A9880334F5a50A9209Aa87F9aa0';

let CONTRACT_ADDRESS: string | null = null;

export function setContractAddress(address: string) {
  CONTRACT_ADDRESS = address;
  localStorage.setItem('genlayer_contract_address', address);
}

export function getContractAddress(): string | null {
  if (!CONTRACT_ADDRESS) {
    CONTRACT_ADDRESS = localStorage.getItem('genlayer_contract_address') || DEFAULT_CONTRACT_ADDRESS;
  }
  return CONTRACT_ADDRESS;
}

// ── MetaMask Detection ────────────────────────────────────────────────────────

function getMetaMask() {
  return (window as any).ethereum || null;
}

function isMetaMaskInstalled(): boolean {
  return !!getMetaMask();
}

let networkChecked = false;

async function ensureCorrectNetwork() {
  if (networkChecked) return;
  const eth = getMetaMask();
  if (!eth) throw new Error('No wallet provider found');

  try {
    const chainIdHex = await eth.request({ method: 'eth_chainId' });
    console.log(`[GenLayer] Current chain: ${chainIdHex}, expected: ${STUDIONET_CHAIN_ID_HEX}`);

    if (chainIdHex?.toLowerCase() !== STUDIONET_CHAIN_ID_HEX.toLowerCase()) {
      console.log(`[GenLayer] Switching to GenLayer Studionet...`);
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
      });
      console.log(`[GenLayer] Network switched`);
    }
  } catch (switchErr: any) {
    console.log(`[GenLayer] Switch error code: ${switchErr.code}`);
    if (switchErr.code === 4902) {
      console.log(`[GenLayer] Adding GenLayer Studionet chain...`);
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: STUDIONET_CHAIN_ID_HEX,
          chainName: STUDIONET_NAME,
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
          rpcUrls: [STUDIONET_RPC],
          blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
        }],
      });
    } else {
      throw switchErr;
    }
  }
  networkChecked = true;
}

// ── GenLayer Client ───────────────────────────────────────────────────────────

async function getClient(walletAddress: string) {
  await ensureCorrectNetwork();

  const eth = getMetaMask();
  if (!eth) throw new Error('No wallet provider found');

  const client = genlayerCreateClient({
    chain: chains.studionet,
    account: walletAddress as `0x${string}`,
    provider: eth,
  });

  return client;
}

// ── Contract Read/Write ────────────────────────────────────────────────────────

/**
 * Read from contract — works with MetaMask and Rabby.
 */
async function readContract(
  client: any,
  functionName: string,
  args: any[] = []
): Promise<any> {
  try {
    const result = await client.readContract({
      address: getContractAddress(),
      functionName,
      args,
    });
    return mapContractResult(result);
  } catch (err: any) {
    console.error(`[GenLayer] readContract failed for ${functionName}:`, err.message);
    throw err;
  }
}

/**
 * Write to contract — MetaMask will popup for signature.
 * This is the function that triggers the real on-chain transaction.
 */
async function writeContract(
  client: any,
  functionName: string,
  args: any[] = []
): Promise<string> {
  console.log(`[GenLayer] writeContract: ${functionName}(${JSON.stringify(args).substring(0, 100)})`);
  console.log(`[GenLayer] Contract: ${getContractAddress()}`);
  console.log(`[GenLayer] MetaMask will popup for signature...`);

  const txHash = await client.writeContract({
    address: getContractAddress(),
    functionName,
    args,
    value: BigInt(0),
  });
  console.log(`[GenLayer] TX submitted: ${txHash}`);

  // Don't wait for receipt — GenLayer AI consensus takes 30-90s+
  // Subscription polling will detect when result is stored in TreeMap
  return txHash;
}

/**
 * Poll a contract read until it returns a non-empty result.
 * GenLayer AI consensus takes 30-90s — poll until TreeMap has data.
 */
async function pollReadUntilResult(
  client: any,
  functionName: string,
  args: any[],
  maxAttempts = 24,
  intervalMs = 5000
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await readContract(client, functionName, args);
      const str = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw || '');
      const isEmpty = !str || str === 'null' || str === 'undefined' || str === '{}' || str === '';
      if (!isEmpty) {
        console.log(`[GenLayer] pollRead hit ${functionName} at attempt ${attempt}`);
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch (_) { return raw; }
        }
        return raw;
      }
      console.log(`[GenLayer] pollRead ${attempt}/${maxAttempts}: empty for ${functionName}, retrying...`);
    } catch (e: any) {
      console.warn(`[GenLayer] pollRead error on attempt ${attempt}: ${e.message}`);
    }
    if (attempt < maxAttempts) {
      const waitMs = Math.min(intervalMs * (1 + attempt * 0.5), 15000);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  console.warn(`[GenLayer] pollRead: max attempts reached for ${functionName}`);
  return null;
}

// ── Result Normalization ──────────────────────────────────────────────────────

function mapContractResult(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && !Array.isArray(val)) {
    if (val.type === 'BigInt' || val.type === 'bigint') return Number(val);
    if (val.value !== undefined) return val.value;
    if (val.inner !== undefined) return val.inner;
  }
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (_) { return val; }
  }
  if (typeof val === 'object' && val !== null) {
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v && typeof v === 'object' && (v as any).type === 'BigInt') {
        normalized[k] = Number((v as any).value ?? v);
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        normalized[k] = mapContractResult(v);
      } else {
        normalized[k] = v;
      }
    }
    return normalized;
  }
  return val;
}

// ── Main API Functions ────────────────────────────────────────────────────────

/**
 * Analyze wallet using Intelligent Contract.
 * MetaMask will popup for signature → TX sent to GenLayer → AI consensus → result stored in TreeMap.
 */
export async function analyzeWalletWithGenLayer(
  address: string,
  fromAddress: string
): Promise<WalletAnalysis | null> {
  if (!isMetaMaskInstalled()) {
    console.log('[GenLayer] MetaMask not installed');
    return null;
  }

  const contractAddress = getContractAddress();
  if (!contractAddress) {
    console.log('[GenLayer] No contract address set');
    return null;
  }

  try {
    console.log(`[GenLayer] === AI WALLET ANALYSIS ===`);
    console.log(`[GenLayer] Wallet: ${fromAddress}`);
    console.log(`[GenLayer] Target: ${address}`);
    console.log(`[GenLayer] Contract: ${contractAddress}`);

    const client = await getClient(fromAddress);

    // Send TX — MetaMask popup for signature
    console.log(`[GenLayer] Sending analyze_wallet TX...`);
    await writeContract(client, 'analyze_wallet', [address]);
    console.log(`[GenLayer] TX sent. Waiting for AI consensus...`);

    return null;
  } catch (error: any) {
    console.error('[GenLayer] Analysis error:', error);

    if (error?.code === 4001 || error?.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    }

    return null;
  }
}

/**
 * Compare wallets using Intelligent Contract.
 * MetaMask will popup for signature → TX sent to GenLayer → AI consensus → result stored in TreeMap.
 */
export async function compareWalletsWithGenLayer(
  addresses: string[],
  fromAddress: string
): Promise<WalletComparison | null> {
  if (!isMetaMaskInstalled()) {
    console.log('[GenLayer] MetaMask not installed');
    return null;
  }

  const contractAddress = getContractAddress();
  if (!contractAddress || addresses.length < 2) {
    console.log('[GenLayer] No contract or insufficient addresses');
    return null;
  }

  try {
    console.log(`[GenLayer] === AI WALLET COMPARISON ===`);
    console.log(`[GenLayer] Wallet: ${fromAddress}`);
    console.log(`[GenLayer] Targets: ${addresses.join(', ')}`);
    console.log(`[GenLayer] Contract: ${contractAddress}`);

    const client = await getClient(fromAddress);

    // Send TX — MetaMask popup for signature
    console.log(`[GenLayer] Sending compare_wallets TX...`);
    await writeContract(client, 'compare_wallets', [addresses]);
    console.log(`[GenLayer] TX sent. Waiting for AI consensus...`);

    return null;
  } catch (error: any) {
    console.error('[GenLayer] Comparison error:', error);

    if (error?.code === 4001 || error?.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    }

    return null;
  }
}

// ── Result Normalization ──────────────────────────────────────────────────────

function normalizeAnalysisResult(result: any): WalletAnalysis {
  const scores = result.scores || {};
  const activitySummary = {
    transaction_history: scores.transaction_history ?? 0,
    protocol_interactions: scores.protocol_interactions ?? 0,
    wallet_age: scores.wallet_age ?? 0,
    portfolio_health: scores.portfolio_health ?? 0,
    risk_indicators: scores.risk_indicators ?? 0,
    total_score: result.trust_score ?? 0,
  };

  return {
    id: crypto.randomUUID(),
    wallet_id: result.address || crypto.randomUUID(),
    trust_score: result.trust_score ?? 50,
    risk_level: result.risk_level ?? 'medium',
    risk_factors: result.risk_factors ?? [],
    positive_factors: result.positive_factors ?? [],
    activity_summary: activitySummary,
    ai_reasoning: result.reasoning ?? 'Analysis performed via GenLayer AI Consensus',
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

function normalizeComparisonResult(result: any, addresses: string[]): WalletComparison {
  const scores: Record<string, number> = {};
  let winner = addresses[0];
  let highestScore = 0;

  addresses.forEach(addr => {
    scores[addr] = result.individual_scores?.[addr] ?? 0;
    if (scores[addr] > highestScore) {
      highestScore = scores[addr];
      winner = addr;
    }
  });

  return {
    id: crypto.randomUUID(),
    wallet_ids: addresses,
    consensus_winner: result.consensus_winner ?? winner,
    consensus_score: result.consensus_score ?? highestScore,
    consensus_reasoning: result.consensus_reasoning ?? 'Consensus reached via GenLayer AI Consensus',
    individual_scores: scores,
    wallet_details: result.wallet_details ?? {},
    created_at: new Date().toISOString(),
  };
}

// ── Realtime Polling System ───────────────────────────────────────────────────

type PollCallback<T> = (data: T | null) => void;
type PollUnsubscribe = () => void;

/**
 * Subscribe to realtime updates from a contract view method.
 * Polls at interval and calls callback when data changes.
 */
export function subscribeToAnalysis(
  address: string,
  callback: PollCallback<WalletAnalysis>,
  intervalMs = 15000
): PollUnsubscribe {
  let lastResult: string = '';
  let active = true;
  let pollCount = 0;
  const maxPolls = 20; // max ~5 minutes
  const startedAt = Date.now();

  const poll = async () => {
    if (!active || pollCount >= maxPolls) return;
    pollCount++;

    try {
      const eth = getMetaMask();
      if (!eth) return;

      const accounts = await eth.request({ method: 'eth_accounts' });
      if (!accounts?.length) return;

      const client = await getClient(accounts[0]);
      const raw = await readContract(client, 'get_analysis', [address]);
      if (!raw || !active) return;

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      if (str !== lastResult && str.trim() !== '' && str !== '""') {
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed && parsed.trust_score !== undefined) {
            const analyzedAt = new Date(parsed.analyzed_at || 0).getTime();
            if (analyzedAt >= startedAt) {
              lastResult = str;
              callback(normalizeAnalysisResult(parsed));
              return; // found result, stop polling
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[GenLayer] Poll error:', e);
    }

    // Exponential backoff: 15s, 20s, 25s, 30s
    const nextDelay = Math.min(intervalMs + pollCount * 3000, 30000);
    if (active) setTimeout(poll, nextDelay);
  };

  poll();
  return () => { active = false; };
}

/**
 * Subscribe to realtime comparison updates.
 */
export function subscribeToComparison(
  callback: PollCallback<WalletComparison>,
  intervalMs = 15000
): PollUnsubscribe {
  let lastComparisonId: string = '';
  let active = true;
  let pollCount = 0;
  const maxPolls = 20;
  const startedAt = Date.now();

  const poll = async () => {
    if (!active || pollCount >= maxPolls) return;
    pollCount++;

    try {
      const eth = getMetaMask();
      if (!eth) return;

      const accounts = await eth.request({ method: 'eth_accounts' });
      if (!accounts?.length) return;

      const client = await getClient(accounts[0]);
      const historyRaw = await readContract(client, 'get_comparison_history', []);
      if (!historyRaw || !active) return;

      let history: string[] = [];
      try { history = typeof historyRaw === 'string' ? JSON.parse(historyRaw) : historyRaw; } catch (_) { history = []; }

      if (history.length > 0) {
        const latestId = history[history.length - 1];
        if (latestId !== lastComparisonId) {
          lastComparisonId = latestId;
          const compRaw = await readContract(client, 'get_comparison', [latestId]);
          if (compRaw && active) {
            try {
              const parsed = typeof compRaw === 'string' ? JSON.parse(compRaw) : compRaw;
              if (parsed && parsed.consensus_winner) {
                const analyzedAt = new Date(parsed.analyzed_at || 0).getTime();
                if (analyzedAt >= startedAt) {
                  callback(normalizeComparisonResult(parsed, parsed.addresses || []));
                  return;
                }
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn('[GenLayer] Comparison poll error:', e);
    }

    const nextDelay = Math.min(intervalMs + pollCount * 3000, 30000);
    if (active) setTimeout(poll, nextDelay);
  };

  poll();
  return () => { active = false; };
}

/**
 * Subscribe to on-chain leaderboard updates.
 */
export function subscribeToLeaderboard(
  callback: PollCallback<Array<{ address: string; name: string; score: number }>>,
  intervalMs = 5000
): PollUnsubscribe {
  let lastResult: string = '';
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const eth = getMetaMask();
      if (!eth) { callback(null); return; }

      const accounts = await eth.request({ method: 'eth_accounts' });
      if (!accounts?.length) { callback(null); return; }

      const client = await getClient(accounts[0]);
      const raw = await readContract(client, 'get_all_analyses', []);
      if (!raw || !active) return;

      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      if (str !== lastResult && str.trim() !== '' && str !== '[]') {
        lastResult = str;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) {
            const leaderboard = parsed
              .map((item: any) => ({
                address: item.address || '',
                name: item.analyzer || item.address?.slice(0, 10) || 'Unknown',
                score: item.trust_score || 0,
              }))
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 20);
            callback(leaderboard);
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[GenLayer] Leaderboard poll error:', e);
    }
    if (active) setTimeout(poll, intervalMs);
  };

  poll();
  return () => { active = false; };
}

// ── Demo Data Generators (Fallback) ──────────────────────────────────────────

function generateDemoAnalysis(address: string): WalletAnalysis {
  const hash = Array.from(address).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = 40 + (hash % 50);
  const trustScore = Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10)));

  const riskFactors = [
    'Interacted with unverified contracts',
    'Received funds from flagged addresses',
    'High-frequency trading pattern detected',
    'Limited transaction history',
    'Connected to known mixer services',
  ].slice(0, Math.floor(Math.random() * 3) + (trustScore < 50 ? 2 : 0));

  const positiveFactors = [
    'Long-standing account history',
    'Consistent transaction patterns',
    'Interacts with reputable DeFi protocols',
    'No suspicious cross-chain transfers',
    'Maintains healthy balance of native tokens',
    'Participates in governance voting',
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
    ai_reasoning: generateAIReasoning(trustScore),
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

function generateAIReasoning(score: number): string {
  if (score >= 80) {
    return 'This wallet demonstrates strong trust indicators including consistent transaction patterns, interactions with established protocols, and a clean transaction history. No suspicious activity detected. Verified via GenLayer AI Consensus.';
  } else if (score >= 60) {
    return 'The wallet shows generally trustworthy behavior with some minor concerns. Transaction history indicates normal usage patterns with reputable contracts. Analysis performed via GenLayer Intelligent Contract.';
  } else if (score >= 40) {
    return 'Mixed signals detected in wallet activity. While some legitimate transactions are present, there are patterns that warrant caution. GenLayer Consensus analysis recommends additional verification.';
  } else {
    return 'Significant risk factors identified including interactions with flagged addresses and unusual transaction patterns. GenLayer AI Consensus flags this address for heightened due diligence.';
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
    consensus_reasoning: `Based on GenLayer AI Consensus analysis of ${addresses.length} wallets, the winner demonstrates the strongest trust profile with consistent transaction patterns and lower risk indicators. Multiple AI validators reached agreement on this assessment.`,
    individual_scores: scores,
    created_at: new Date().toISOString(),
  };
}

// ── Type Declaration ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (params: any) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
  }
}
