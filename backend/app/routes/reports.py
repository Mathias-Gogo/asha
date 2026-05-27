from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.report_service import report_service
from app.dependencies import get_db

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{business_id}")
def get_full_report(business_id: int, db: Session = Depends(get_db)):
    """
    Returns the full assembled report for a business:
    business info + latest research + latest strategy + scores.
    """
    report = report_service.get_full_report(db, business_id)
    if report.get("error"):
        raise HTTPException(status_code=404, detail=report["error"])
    return report
