from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Business ──────────────────────────────────────────────────────────────────

class BusinessInput(BaseModel):
    business_name: str
    niche: str
    goal: str
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None


class BusinessResponse(BaseModel):
    id: int
    name: str
    niche: str
    goal: str
    instagram: Optional[str]
    twitter: Optional[str]
    website: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Research Report ───────────────────────────────────────────────────────────

class ResearchReportResponse(BaseModel):
    id: int
    business_id: int
    audience: Optional[str]
    competitors: Optional[str]
    content_gaps: Optional[str]
    growth_problems: Optional[str]
    market_trends: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Strategy ──────────────────────────────────────────────────────────────────

class StrategyInput(BaseModel):
    business_id: int
    report_id: Optional[int] = None


class StrategyResponse(BaseModel):
    id: int
    business_id: int
    report_id: Optional[int]
    short_term: Optional[str]
    long_term: Optional[str]
    campaigns: Optional[str]
    recommendations: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Score ─────────────────────────────────────────────────────────────────────

class ScoreResponse(BaseModel):
    id: int
    report_id: int
    feasibility: Optional[float]
    difficulty: Optional[float]
    growth_potential: Optional[float]
    budget_realism: Optional[float]
    niche_alignment: Optional[float]
    overall: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Full Report (combined response) ───────────────────────────────────────────

class FullReportResponse(BaseModel):
    business: BusinessResponse
    research: Optional[ResearchReportResponse]
    strategy: Optional[StrategyResponse]
    scores: Optional[ScoreResponse]
