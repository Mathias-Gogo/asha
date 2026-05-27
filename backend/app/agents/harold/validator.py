from app.utils.logger import logger


class HaroldValidator:
    """
    Validates Harold's strategy output before it reaches the scoring layer.
    Normalises lists, removes empty entries, flags missing fields.
    """

    REQUIRED_FIELDS = ["short_term", "long_term", "campaigns", "recommendations", "quick_wins"]

    def validate(self, strategy: dict) -> dict:
        if strategy.get("parse_error"):
            return strategy

        strategy = self._ensure_lists(strategy)
        strategy = self._remove_empty(strategy)
        strategy = self._trim(strategy, max_items=5)

        missing = [f for f in self.REQUIRED_FIELDS if not strategy.get(f)]
        if missing:
            logger.warning(f"HaroldValidator: missing fields: {missing}")
            strategy["missing_fields"] = missing

        return strategy

    def _ensure_lists(self, strategy: dict) -> dict:
        list_fields = ["short_term", "long_term", "recommendations", "quick_wins"]
        for field in list_fields:
            val = strategy.get(field)
            if isinstance(val, str):
                strategy[field] = [val]
            elif not isinstance(val, list):
                strategy[field] = []

        if not isinstance(strategy.get("campaigns"), list):
            strategy["campaigns"] = []

        return strategy

    def _remove_empty(self, strategy: dict) -> dict:
        list_fields = ["short_term", "long_term", "recommendations", "quick_wins"]
        for field in list_fields:
            strategy[field] = [item for item in strategy.get(field, []) if item and str(item).strip()]
        return strategy

    def _trim(self, strategy: dict, max_items: int) -> dict:
        list_fields = ["short_term", "long_term", "recommendations", "quick_wins", "campaigns"]
        for field in list_fields:
            if isinstance(strategy.get(field), list):
                strategy[field] = strategy[field][:max_items]
        return strategy
