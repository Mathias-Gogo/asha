from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.schemas import BusinessInput, ResearchReportResponse
from app.database import crud
from app.agents.halo.workflow import halo_workflow
from app.dependencies import get_db

router = APIRouter(prefix="/research", tags=["Research"])


@router.post("/run")
async def run_research(data: BusinessInput, db: Session = Depends(get_db)):
    """
    Run Halo research pipeline on a business.
    Creates a new Business record if needed, then saves the research report.
    """
    # Save business to DB
    business = crud.create_business(db, {
        "name":      data.business_name,
        "niche":     data.niche,
        "goal":      data.goal,
        "instagram": data.instagram,
        "twitter":   data.twitter,
        "website":   data.website,
    })

    # Run Halo agent
    research = await halo_workflow(data.model_dump())

    if research.get("parse_error"):
        raise HTTPException(status_code=502, detail="AI returned unparseable output")

    # Persist report
    report = crud.create_research_report(db, business.id, research)

    return {
        "business_id": business.id,
        "report_id":   report.id,
        "research":    research,
    }


@router.get("/{report_id}", response_model=ResearchReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = crud.get_research_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
