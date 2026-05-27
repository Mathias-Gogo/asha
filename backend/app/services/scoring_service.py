from app.utils.logger import logger


class ScoringService:
    """
    Validation layer. Scores research + strategy for realism.
    Checks: budget realism, niche alignment, execution difficulty, growth likelihood.
    """

    KNOWN_NICHES = [
        "fitness", "food", "tech", "fashion", "beauty", "finance",
        "health", "education", "travel", "gaming", "music", "art",
        "real estate", "ecommerce", "saas", "consulting", "coaching",
    ]

    def score(self, research: dict, strategy: dict, business_data: dict) -> dict:
        niche = business_data.get("niche", "").lower()

        feasibility    = self._score_feasibility(strategy)
        difficulty     = self._score_difficulty(strategy)
        growth_pot     = self._score_growth_potential(research)
        budget_realism = self._score_budget_realism(strategy)
        niche_align    = self._score_niche_alignment(niche, research)

        overall = round(
            (feasibility * 0.25) +
            ((10 - difficulty) * 0.15) +
            (growth_pot * 0.30) +
            (budget_realism * 0.15) +
            (niche_align * 0.15),
            2,
        )

        scores = {
            "feasibility":     round(feasibility, 2),
            "difficulty":      round(difficulty, 2),
            "growth_potential": round(growth_pot, 2),
            "budget_realism":  round(budget_realism, 2),
            "niche_alignment": round(niche_align, 2),
            "overall":         overall,
        }

        logger.info(f"Scores computed: {scores}")
        return scores

    # ── Private scoring methods ───────────────────────────────────────────────

    def _score_feasibility(self, strategy: dict) -> float:
        """More concrete short-term actions = more feasible."""
        short_term = strategy.get("short_term", [])
        if not short_term:
            return 4.0
        count = len(short_term)
        base = min(count * 1.5, 7.0)
        # bonus if recommendations exist
        if strategy.get("recommendations"):
            base += 1.5
        return min(base, 10.0)

    def _score_difficulty(self, strategy: dict) -> float:
        """More long-term actions = higher execution difficulty."""
        long_term = strategy.get("long_term", [])
        campaigns = strategy.get("campaigns", [])
        base = 3.0
        base += len(long_term) * 0.5
        base += len(campaigns) * 0.4
        return min(base, 10.0)

    def _score_growth_potential(self, research: dict) -> float:
        """More identified gaps + trends = higher growth potential."""
        gaps   = len(research.get("content_gaps", []))
        trends = len(research.get("market_trends", []))
        base = 4.0 + (gaps * 0.6) + (trends * 0.5)
        return min(base, 10.0)

    def _score_budget_realism(self, strategy: dict) -> float:
        """Penalise strategies with no quick wins (likely expensive)."""
        campaigns = strategy.get("campaigns", [])
        if not campaigns:
            return 5.0
        # Simple heuristic: more campaigns without quick wins = budget risk
        quick_wins = strategy.get("quick_wins", [])
        if quick_wins:
            return min(7.0 + len(quick_wins) * 0.5, 10.0)
        return max(10.0 - len(campaigns) * 0.5, 3.0)

    def _score_niche_alignment(self, niche: str, research: dict) -> float:
        """Reward recognised niches with audience data."""
        base = 5.0
        if any(n in niche for n in self.KNOWN_NICHES):
            base += 2.0
        if research.get("audience"):
            base += 1.5
        if research.get("competitors"):
            base += 1.0
        return min(base, 10.0)


# Singleton
scoring_service = ScoringService()
