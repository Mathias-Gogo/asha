from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    niche = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    instagram = Column(String, nullable=True)
    twitter = Column(String, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    research_reports = relationship("ResearchReport", back_populates="business")
    strategies = relationship("Strategy", back_populates="business")


class ResearchReport(Base):
    __tablename__ = "research_reports"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    audience = Column(Text, nullable=True)
    competitors = Column(Text, nullable=True)       # JSON string
    content_gaps = Column(Text, nullable=True)      # JSON string
    growth_problems = Column(Text, nullable=True)   # JSON string
    market_trends = Column(Text, nullable=True)     # JSON string
    raw_output = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="research_reports")
    scores = relationship("Score", back_populates="report")


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("research_reports.id"), nullable=True)
    short_term = Column(Text, nullable=True)        # JSON string
    long_term = Column(Text, nullable=True)         # JSON string
    campaigns = Column(Text, nullable=True)         # JSON string
    recommendations = Column(Text, nullable=True)   # JSON string
    raw_output = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="strategies")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("research_reports.id"), nullable=False)
    feasibility = Column(Float, nullable=True)
    difficulty = Column(Float, nullable=True)
    growth_potential = Column(Float, nullable=True)
    budget_realism = Column(Float, nullable=True)
    niche_alignment = Column(Float, nullable=True)
    overall = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    report = relationship("ResearchReport", back_populates="scores")
