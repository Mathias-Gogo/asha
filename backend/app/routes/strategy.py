from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.schemas import StrategyInput, StrategyResponse
from app.database import crud
from app.agents.harold.workflow import harold_workflow
from app.services.scoring_service import scoring_service
from app.dependencies import get_db

router = APIRouter(prefix="/strategy", tags=["Strategy"])


@router.post("/generate")
async def generate_strategy(data: StrategyInput, db: Session = Depends(get_db)):
    """
    Run Harold strategy pipeline using the latest research report for a business.
    Saves strategy and validation scores to DB.
    """
    business = crud.get_business(db, data.business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Resolve report
    report_id = data.report_id
    if report_id:
        report = crud.get_research_report(db, report_id)
    else:
        reports = crud.get_reports_for_business(db, data.business_id)
        report = reports[-1] if reports else None

    if not report:
        raise HTTPException(status_code=404, detail="No research report found. Run /research/run first.")

    import json
    research = {
        "audience":       report.audience,
        "competitors":    json.loads(report.competitors or "[]"),
        "content_gaps":   json.loads(report.content_gaps or "[]"),
        "growth_problems":json.loads(report.growth_problems or "[]"),
        "market_trends":  json.loads(report.market_trends or "[]"),
    }

    business_data = {
        "business_name": business.name,
        "niche":         business.niche,
        "goal":          business.goal,
    }

    # Run Harold agent
    strategy = await harold_workflow(business_data, research)

    if strategy.get("parse_error"):
        raise HTTPException(status_code=502, detail="AI returned unparseable output")

    # Persist strategy
    saved_strategy = crud.create_strategy(db, business.id, report.id, strategy)

    # Run validation scoring
    scores = scoring_service.score(research, strategy, business_data)
    saved_score = crud.create_score(db, report.id, scores)

    return {
        "business_id": business.id,
        "report_id":   report.id,
        "strategy_id": saved_strategy.id,
        "strategy":    strategy,
        "scores":      scores,
    }
