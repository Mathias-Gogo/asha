import json
from sqlalchemy.orm import Session
from app.database import crud
from app.utils.logger import logger


class ReportService:

    def get_full_report(self, db: Session, business_id: int) -> dict:
        business = crud.get_business(db, business_id)
        if not business:
            return {"error": "Business not found"}

        reports = crud.get_reports_for_business(db, business_id)
        latest_report = reports[-1] if reports else None

        strategy = None
        scores = None

        if latest_report:
            scores = crud.get_score_for_report(db, latest_report.id)
            strategies = db.query(__import__("app.database.models", fromlist=["Strategy"]).Strategy)\
                .filter_by(business_id=business_id).all()
            strategy = strategies[-1] if strategies else None

        return {
            "business": {
                "id": business.id,
                "name": business.name,
                "niche": business.niche,
                "goal": business.goal,
                "instagram": business.instagram,
                "twitter": business.twitter,
                "website": business.website,
            },
            "research": self._format_report(latest_report),
            "strategy": self._format_strategy(strategy),
            "scores": self._format_scores(scores),
        }

    def _format_report(self, report) -> dict | None:
        if not report:
            return None
        return {
            "id": report.id,
            "audience": report.audience,
            "competitors": self._parse_json(report.competitors),
            "content_gaps": self._parse_json(report.content_gaps),
            "growth_problems": self._parse_json(report.growth_problems),
            "market_trends": self._parse_json(report.market_trends),
            "created_at": str(report.created_at),
        }

    def _format_strategy(self, strategy) -> dict | None:
        if not strategy:
            return None
        return {
            "id": strategy.id,
            "short_term": self._parse_json(strategy.short_term),
            "long_term": self._parse_json(strategy.long_term),
            "campaigns": self._parse_json(strategy.campaigns),
            "recommendations": self._parse_json(strategy.recommendations),
            "created_at": str(strategy.created_at),
        }

    def _format_scores(self, scores) -> dict | None:
        if not scores:
            return None
        return {
            "feasibility": scores.feasibility,
            "difficulty": scores.difficulty,
            "growth_potential": scores.growth_potential,
            "budget_realism": scores.budget_realism,
            "niche_alignment": scores.niche_alignment,
            "overall": scores.overall,
        }

    def _parse_json(self, value: str | None):
        if not value:
            return []
        try:
            return json.loads(value)
        except Exception:
            return value


report_service = ReportService()
