from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine
from app.database.models import Base
from app.routes import business, research, strategy, reports, chat

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Marketing Platform",
    description="Structured business analysis pipeline powered by Halo + Harold agents.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(business.router)
app.include_router(research.router)
app.include_router(strategy.router)
app.include_router(reports.router)
app.include_router(chat.router)


@app.get("/")
def home():
    return {"message": "Platform running", "docs": "/docs"}
