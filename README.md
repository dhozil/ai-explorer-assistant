# AI Explorer Assistant

A futuristic blockchain wallet analysis tool powered by GenLayer Intelligent Contracts with AI consensus-based trust scoring.

## Features

- **GenLayer Integration** - Built on GenLayer Studionet with Intelligent Contracts
- **MetaMask Wallet Connect** - Connect your wallet to access all features
- **AI Trust Scoring** - Consensus-based trust assessment via GenLayer AI validators
- **Blockchain Analysis** - Real-time scanning of wallet transactions and on-chain behavior
- **Risk Assessment** - Categorized risk levels: Very Low, Low, Medium, High, Very High
- **Consensus Comparison** - Compare up to 5 wallets with AI consensus winner
- **Realtime Updates** - Live polling for on-chain analysis results and comparison outcomes

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom hologram animations
- **Blockchain**: GenLayer Studionet
- **Smart Contracts**: GenLayer Intelligent Contracts (Python)
- **Wallet SDK**: genlayer-js (CDN)
- **Icons**: Lucide React
- **Wallet**: MetaMask integration

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension

### Installation

```bash
npm install
npm run dev
```

### Wallet Setup

1. Install MetaMask browser extension
2. Click "Connect Wallet" in the app header
3. Approve the connection in MetaMask
4. The app will auto-add GenLayer Studionet network

## GenLayer Studionet Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | GenLayer Studio |
| RPC URL | https://studio.genlayer.com/api |
| Chain ID | 61999 (0xF22F) |
| Currency | GEN |
| Explorer | https://studio.genlayer.com/explorer |

## Deployed Contract

| Parameter | Value |
|-----------|-------|
| Contract Address | `0x888F953c2F0D3A9880334F5a50A9209Aa87F9aa0` |
| Network | GenLayer Studionet |
| Language | Python (GenLayer SDK) |

### Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `analyze_wallet(address)` | write | Analyze wallet with AI consensus (30-90s) |
| `compare_wallets(addresses)` | write | Compare multiple wallets for trust |
| `get_analysis(address)` | view | Get stored analysis (instant) |
| `get_comparison(id)` | view | Get specific comparison result |
| `get_comparison_history()` | view | Get all comparison IDs |
| `get_all_analyses()` | view | Get all stored analyses |

### AI Consensus Mechanism

The contract uses GenLayer's `prompt_comparative` for fast validator agreement:

1. **LLM Prompt** — Each validator independently calls `gl.nondet.exec_prompt()` to evaluate the wallet
2. **Structural Consensus** — `gl.eq_principle.prompt_comparative()` validates that all validators produce valid JSON with the correct structure
3. **On-Chain Storage** — Result is parsed and stored in `TreeMap` for instant reads

**Scoring Dimensions (each 0-20, total 100):**
- `transaction_history` — Volume, frequency, consistency
- `protocol_interactions` — DeFi usage, verified contracts
- `wallet_age` — Account maturity
- `portfolio_health` — Token diversity, balance stability
- `risk_indicators` — Mixer usage, flagged addresses

## Realtime Architecture

```
Browser ──write──> MetaMask ──sign──> GenLayer Studionet
  │                                        │
  ├── subscribeToAnalysis() ──────────────> poll get_analysis() every 3s
  ├── subscribeToComparison() ────────────> poll get_comparison_history() every 3s
  └── subscribeToLeaderboard() ──────────> poll get_all_analyses() every 5s
```

### How Realtime Works

1. **Write Transaction** — User clicks "Analyze" → MetaMask signs TX → sent to GenLayer
2. **AI Consensus** — Validators run LLM evaluation (30-90s)
3. **Polling Loop** — Frontend polls contract view methods every 3 seconds
4. **Result Received** — When TreeMap has data, callback fires and UI updates
5. **Auto-Stop** — Polling stops when user navigates away or component unmounts

### Realtime Subscriptions

```typescript
import { subscribeToAnalysis, subscribeToComparison } from './lib/genlayer';

// Subscribe to analysis updates for a specific address
const unsubscribe = subscribeToAnalysis(
  '0x...',
  (analysis) => {
    // Called every 3s when on-chain data changes
    console.log('Trust score:', analysis.trust_score);
  },
  3000 // interval in ms
);

// Stop polling
unsubscribe();
```

## Project Structure

```
├── contracts/
│   └── wallet_analyzer.py    # GenLayer Intelligent Contract (Python)
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── HoloCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ScoreRing.tsx
│   │   ├── WalletAnalysisView.tsx
│   │   ├── WalletComparison.tsx
│   │   ├── WalletConnectButton.tsx
│   │   └── WalletInput.tsx
│   ├── lib/
│   │   ├── genlayer.ts       # GenLayer SDK + realtime polling
│   │   ├── wallet.tsx        # Wallet context + MetaMask
│   │   ├── utils.ts
│   │   ├── blockchain.ts     # Fallback demo data
│   │   └── supabase.ts       # Optional Supabase
│   ├── types/
│   │   └── database.ts
│   ├── App.tsx               # Main app with realtime subscriptions
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── functions/
└── ...
```

## UI Design

Futuristic hologram-style interface:

- Animated grid background
- Glitch text effects
- Gradient score rings
- Scan line animations
- Neon color scheme (cyan, blue, purple, green)
- Realtime consensus status indicator

## Usage

### Connect Wallet

1. Click "Connect Wallet" button in header
2. Approve MetaMask connection
3. Switch to GenLayer Studionet when prompted

### Single Wallet Analysis

1. Enter a wallet address (e.g., `0x...`)
2. Click "Analyze"
3. Watch realtime status: "Submitting transaction..." → "AI consensus computing..."
4. View trust score, risk factors, positive indicators, and AI reasoning

### Wallet Comparison

1. Switch to "Compare Mode"
2. Add 2-5 wallet addresses
3. Click "Compare X Wallets"
4. Watch realtime consensus progress
5. View consensus winner and score distribution

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

## License

MIT
