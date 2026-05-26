from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.schemas import BusinessInput, BusinessResponse
from app.database import crud
from app.dependencies import get_db

router = APIRouter(prefix="/business", tags=["Business"])


@router.post("/create", response_model=BusinessResponse)
def create_business(data: BusinessInput, db: Session = Depends(get_db)):
    business = crud.create_business(db, {
        "name":      data.business_name,
        "niche":     data.niche,
        "goal":      data.goal,
        "instagram": data.instagram,
        "twitter":   data.twitter,
        "website":   data.website,
    })
    return business


@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(business_id: int, db: Session = Depends(get_db)):
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.get("/", response_model=list[BusinessResponse])
def list_businesses(db: Session = Depends(get_db)):
    return crud.get_all_businesses(db)
