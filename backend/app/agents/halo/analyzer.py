from app.utils.logger import logger


class HaloAnalyzer:
    """
    Post-processes raw Halo research.
    Normalises lists, trims noise, flags missing fields.
    """

    REQUIRED_FIELDS = ["audience", "competitors", "content_gaps", "growth_problems", "market_trends"]

    def analyze(self, research: dict) -> dict:
        if research.get("parse_error"):
            logger.warning("HaloAnalyzer: skipping analysis, parse error present")
            return research

        research = self._ensure_lists(research)
        research = self._trim_lists(research, max_items=5)
        missing = self._check_missing(research)

        if missing:
            logger.warning(f"HaloAnalyzer: missing fields: {missing}")
            research["missing_fields"] = missing

        return research

    def _ensure_lists(self, research: dict) -> dict:
        list_fields = ["competitors", "content_gaps", "growth_problems", "market_trends", "strengths", "weaknesses"]
        for field in list_fields:
            val = research.get(field)
            if isinstance(val, str):
                research[field] = [val]
            elif not isinstance(val, list):
                research[field] = []
        return research

    def _trim_lists(self, research: dict, max_items: int) -> dict:
        list_fields = ["competitors", "content_gaps", "growth_problems", "market_trends", "strengths", "weaknesses"]
        for field in list_fields:
            if isinstance(research.get(field), list):
                research[field] = research[field][:max_items]
        return research

    def _check_missing(self, research: dict) -> list:
        return [f for f in self.REQUIRED_FIELDS if not research.get(f)]
