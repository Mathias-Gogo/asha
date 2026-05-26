import json
from sqlalchemy.orm import Session
from app.database import models


# ── Business ──────────────────────────────────────────────────────────────────

def create_business(db: Session, data: dict) -> models.Business:
    business = models.Business(**data)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


def get_business(db: Session, business_id: int) -> models.Business | None:
    return db.query(models.Business).filter(models.Business.id == business_id).first()


def get_all_businesses(db: Session) -> list[models.Business]:
    return db.query(models.Business).all()


# ── Research Report ───────────────────────────────────────────────────────────

def create_research_report(db: Session, business_id: int, research: dict) -> models.ResearchReport:
    report = models.ResearchReport(
        business_id=business_id,
        audience=research.get("audience"),
        competitors=json.dumps(research.get("competitors", [])),
        content_gaps=json.dumps(research.get("content_gaps", [])),
        growth_problems=json.dumps(research.get("growth_problems", [])),
        market_trends=json.dumps(research.get("market_trends", [])),
        raw_output=json.dumps(research),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_research_report(db: Session, report_id: int) -> models.ResearchReport | None:
    return db.query(models.ResearchReport).filter(models.ResearchReport.id == report_id).first()


def get_reports_for_business(db: Session, business_id: int) -> list[models.ResearchReport]:
    return db.query(models.ResearchReport).filter(models.ResearchReport.business_id == business_id).all()


# ── Strategy ──────────────────────────────────────────────────────────────────

def create_strategy(db: Session, business_id: int, report_id: int | None, strategy: dict) -> models.Strategy:
    record = models.Strategy(
        business_id=business_id,
        report_id=report_id,
        short_term=json.dumps(strategy.get("short_term", [])),
        long_term=json.dumps(strategy.get("long_term", [])),
        campaigns=json.dumps(strategy.get("campaigns", [])),
        recommendations=json.dumps(strategy.get("recommendations", [])),
        raw_output=json.dumps(strategy),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_strategy(db: Session, strategy_id: int) -> models.Strategy | None:
    return db.query(models.Strategy).filter(models.Strategy.id == strategy_id).first()


# ── Scores ────────────────────────────────────────────────────────────────────

def create_score(db: Session, report_id: int, scores: dict) -> models.Score:
    record = models.Score(
        report_id=report_id,
        feasibility=scores.get("feasibility"),
        difficulty=scores.get("difficulty"),
        growth_potential=scores.get("growth_potential"),
        budget_realism=scores.get("budget_realism"),
        niche_alignment=scores.get("niche_alignment"),
        overall=scores.get("overall"),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_score_for_report(db: Session, report_id: int) -> models.Score | None:
    return db.query(models.Score).filter(models.Score.report_id == report_id).first()
