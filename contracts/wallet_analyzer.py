# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import re as regex_mod


class WalletAnalyzer(gl.Contract):
    """
    Intelligent Contract for AI-powered wallet trust analysis.
    Uses GenLayer's consensus mechanism to analyze wallet behavior.
    """

    # Persistent storage — TreeMap for GenLayer compatibility
    analyses: TreeMap[str, str]
    comparison_history: TreeMap[str, str]
    comparison_counter: bigint

    def __init__(self):
        self.comparison_counter = 0

    # ── Read Methods ────────────────────────────────────────────────────────

    @gl.public.view
    def get_analysis(self, address: str) -> str:
        """Get stored analysis for a wallet"""
        return self.analyses.get(address, "")

    @gl.public.view
    def get_comparison(self, comparison_id: str) -> str:
        """Get a specific comparison result"""
        return self.comparison_history.get(comparison_id, "")

    @gl.public.view
    def get_comparison_history(self) -> str:
        """Get all comparison IDs"""
        ids = []
        for cid in self.comparison_history.keys():
            ids.append(cid)
        return json.dumps(ids)

    @gl.public.view
    def get_all_analyses(self) -> str:
        """Get all stored analyses"""
        results = []
        for addr in self.analyses.keys():
            raw = self.analyses.get(addr, "")
            if raw:
                results.append(json.loads(raw))
        return json.dumps(results)

    # ── Write Methods ───────────────────────────────────────────────────────

    @gl.public.write
    def analyze_wallet(self, address: str) -> str:
        """
        Analyze a wallet address and return trust score with reasoning.
        Uses gl.nondet.exec_prompt + prompt_comparative for fast consensus.
        """
        if not address or not isinstance(address, str) or not address.startswith("0x"):
            return json.dumps({"error": "Invalid Ethereum address format"})

        def judge() -> str:
            p = (
                f'You are a blockchain wallet trust analyst. '
                f'You MUST evaluate this wallet and return scores — never return zeros.\n'
                f'WALLET ADDRESS: {address}\n'
                f'\nEvaluate this Ethereum wallet on 5 dimensions (each 1-20, max 100 total):\n'
                f'  1. TRANSACTION_HISTORY — volume, frequency, consistency (1-20)\n'
                f'  2. PROTOCOL_INTERACTIONS — DeFi usage, verified contracts (1-20)\n'
                f'  3. WALLET_AGE — account maturity, first tx timestamp (1-20)\n'
                f'  4. PORTFOLIO_HEALTH — token diversity, balance stability (1-20)\n'
                f'  5. RISK_INDICATORS — mixer usage, flagged addresses, suspicious patterns (1-20)\n'
                f'\nFor ANY Ethereum address, assign reasonable scores based on address characteristics. '
                f'Higher score = more trustworthy. A completely unknown address should score ~8-12 per dimension.\n'
                f'\nAlso determine risk_level based on total score:\n'
                f'  80-100: "very_low", 60-79: "low", 40-59: "medium", 20-39: "high", 0-19: "very_high"\n'
                f'\nProvide 2-4 risk_factors (strings) and 2-4 positive_factors (strings) explaining your evaluation.\n'
                f'\nReturn ONLY valid JSON:\n'
                f'{{"transaction_history":<int>,"protocol_interactions":<int>,"wallet_age":<int>,'
                f'"portfolio_health":<int>,"risk_indicators":<int>,"risk_level":"<string>",'
                f'"risk_factors":["<string>",...],"positive_factors":["<string>",...],"reasoning":"<string>"}}'
            )
            return gl.nondet.exec_prompt(p, response_format="json")

        raw = gl.eq_principle.prompt_comparative(
            judge,
            "Both outputs must have exactly 5 integer keys (each 1-20): "
            "transaction_history, protocol_interactions, wallet_age, portfolio_health, risk_indicators. "
            "Plus string key risk_level (very_low/low/medium/high/very_high), "
            "array keys risk_factors and positive_factors (each with 2-4 strings), and string key reasoning. "
            "All scores must be between 1 and 20 — never return zeros."
        )

        # prompt_comparative returns a dict — extract values by key directly
        if isinstance(raw, dict):
            transaction_history = int(raw.get("transaction_history", 10))
            protocol_interactions = int(raw.get("protocol_interactions", 10))
            wallet_age = int(raw.get("wallet_age", 10))
            portfolio_health = int(raw.get("portfolio_health", 10))
            risk_indicators = int(raw.get("risk_indicators", 10))
            risk_factors = raw.get("risk_factors", []) if isinstance(raw.get("risk_factors"), list) else []
            positive_factors = raw.get("positive_factors", []) if isinstance(raw.get("positive_factors"), list) else []
            reasoning = str(raw.get("reasoning", ""))
        else:
            # Fallback: regex extraction from string representation
            all_nums = regex_mod.findall(r'\b(\d+)\b', str(raw))
            scores_found = [int(n) for n in all_nums if 0 <= int(n) <= 20]
            transaction_history = scores_found[0] if len(scores_found) > 0 else 10
            protocol_interactions = scores_found[1] if len(scores_found) > 1 else 10
            wallet_age = scores_found[2] if len(scores_found) > 2 else 10
            portfolio_health = scores_found[3] if len(scores_found) > 3 else 10
            risk_indicators = scores_found[4] if len(scores_found) > 4 else 10
            risk_factors = []
            positive_factors = []
            reasoning = ""
            raw_str = str(raw)
            rf_match = regex_mod.search(r'"risk_factors"\s*:\s*\[([^\]]*)\]', raw_str)
            if rf_match:
                parts = regex_mod.findall(r'"([^"]*)"', rf_match.group(1))
                risk_factors = [s for s in parts if s]
            pf_match = regex_mod.search(r'"positive_factors"\s*:\s*\[([^\]]*)\]', raw_str)
            if pf_match:
                parts = regex_mod.findall(r'"([^"]*)"', pf_match.group(1))
                positive_factors = [s for s in parts if s]
            reason_match = regex_mod.search(r'"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"', raw_str)
            if reason_match:
                reasoning = reason_match.group(1).replace('\\"', '"')

        # Clamp scores to 0-20
        transaction_history = max(0, min(20, transaction_history))
        protocol_interactions = max(0, min(20, protocol_interactions))
        wallet_age = max(0, min(20, wallet_age))
        portfolio_health = max(0, min(20, portfolio_health))
        risk_indicators = max(0, min(20, risk_indicators))

        trust_score = (
            transaction_history + protocol_interactions + wallet_age +
            portfolio_health + risk_indicators
        )

        # Determine risk level from total score
        if trust_score >= 80:
            risk_level = "very_low"
        elif trust_score >= 60:
            risk_level = "low"
        elif trust_score >= 40:
            risk_level = "medium"
        elif trust_score >= 20:
            risk_level = "high"
        else:
            risk_level = "very_high"

        if not reasoning:
            reasoning = "Analysis completed via GenLayer AI Consensus"

        if not reasoning:
            reasoning = "Analysis completed via GenLayer AI Consensus"

        result = {
            "address": address,
            "trust_score": trust_score,
            "risk_level": risk_level,
            "scores": {
                "transaction_history": transaction_history,
                "protocol_interactions": protocol_interactions,
                "wallet_age": wallet_age,
                "portfolio_health": portfolio_health,
                "risk_indicators": risk_indicators
            },
            "risk_factors": risk_factors,
            "positive_factors": positive_factors,
            "reasoning": reasoning,
            "analyzed_at": gl.message_raw["datetime"],
            "analyzer": str(gl.message.sender_address)
        }

        self.analyses[address] = json.dumps(result)
        return json.dumps(result)

    @gl.public.write
    def compare_wallets(self, addresses: DynArray[str]) -> str:
        """
        Compare multiple wallets and determine consensus winner.
        Uses prompt_comparative for fast validator agreement.
        """
        if len(addresses) < 2:
            return json.dumps({"error": "At least 2 addresses required"})

        for addr in addresses:
            if not addr or not isinstance(addr, str) or not addr.startswith("0x"):
                return json.dumps({"error": f"Invalid address: {addr}"})

        # Collect or generate scores for each address
        scores = {}
        analysis_results = {}

        for addr in addresses:
            raw = self.analyses.get(addr, "")
            if raw:
                try:
                    stored = json.loads(raw)
                    analysis_results[addr] = stored
                    scores[addr] = float(stored.get("trust_score", 50))
                except (json.JSONDecodeError, AttributeError):
                    analysis = self._quick_analyze(addr)
                    analysis_results[addr] = analysis
                    scores[addr] = float(analysis["trust_score"])
            else:
                analysis = self._quick_analyze(addr)
                analysis_results[addr] = analysis
                scores[addr] = float(analysis["trust_score"])

        # AI consensus for winner determination
        def judge_winner() -> str:
            addr_list = ", ".join(addresses)
            p = (
                f'You are comparing {len(addresses)} Ethereum wallets for trustworthiness.\n'
                f'WALLETS: {addr_list}\n'
                f'\nWallet scores:\n'
            )
            for addr in addresses:
                p += f'  - {addr}: score={scores[addr]}, risk={analysis_results[addr].get("risk_level", "medium")}\n'

            p += (
                f'\nReturn ONLY valid JSON:\n'
                f'{{"winner":"<address>","consensus_reasoning":"<string>","ranking":["<addr1>","<addr2>",...]}}'
            )
            return gl.nondet.exec_prompt(p, response_format="json")

        raw = gl.eq_principle.prompt_comparative(
            judge_winner,
            "Both outputs must be valid JSON with keys: winner (a valid wallet address from the list), "
            "consensus_reasoning (explanation string), ranking (array of all addresses sorted by trust)."
        )

        # Parse AI result
        try:
            parsed = json.loads(str(raw))
            ai_winner = parsed.get("winner", "")
            consensus_reasoning = str(parsed.get("consensus_reasoning", ""))
            ranking = parsed.get("ranking", [])
        except (json.JSONDecodeError, AttributeError):
            ai_winner = ""
            consensus_reasoning = ""
            ranking = []

        # Determine winner: prefer AI consensus, fallback to highest score
        if ai_winner and ai_winner in scores:
            consensus_winner = ai_winner
            consensus_score = scores[ai_winner]
        else:
            winner = max(scores.items(), key=lambda x: x[1])
            consensus_winner = winner[0]
            consensus_score = winner[1]
            if not consensus_reasoning:
                consensus_reasoning = "Winner determined by highest trust score"

        if not ranking:
            ranking = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

        # Build detailed per-wallet analysis from stored data
        wallet_details = {}
        for addr in addresses:
            raw = self.analyses.get(addr, "")
            if raw:
                try:
                    stored = json.loads(raw)
                    wallet_details[addr] = stored
                except (json.JSONDecodeError, AttributeError):
                    wallet_details[addr] = self._quick_analyze(addr)
            else:
                wallet_details[addr] = self._quick_analyze(addr)

        comparison_id = f"cmp_{self.comparison_counter}"
        self.comparison_counter = self.comparison_counter + 1

        result = {
            "comparison_id": comparison_id,
            "addresses": addresses,
            "individual_scores": scores,
            "wallet_details": wallet_details,
            "consensus_winner": consensus_winner,
            "consensus_score": consensus_score,
            "consensus_reasoning": consensus_reasoning,
            "ranking": ranking,
            "analyzed_at": gl.message_raw["datetime"]
        }

        self.comparison_history[comparison_id] = json.dumps(result)
        return json.dumps(result)

    def _quick_analyze(self, address: str) -> dict:
        """Quick analysis for addresses not in storage"""
        addr_hash = sum(ord(c) for c in address)
        base_score = 40 + (addr_hash % 50)

        return {
            "address": address,
            "trust_score": base_score,
            "risk_level": "medium" if 40 <= base_score < 60 else ("low" if base_score >= 60 else "high"),
            "scores": {
                "transaction_history": base_score // 5,
                "protocol_interactions": base_score // 5,
                "wallet_age": base_score // 5,
                "portfolio_health": base_score // 5,
                "risk_indicators": base_score // 5
            },
            "risk_factors": ["Limited analysis data — full AI analysis recommended"],
            "positive_factors": ["Address format valid"],
            "reasoning": "Quick analysis performed based on address pattern"
        }
