from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.services.orchestrator import orchestrate
from app.dependencies import get_db

router = APIRouter(prefix="/api", tags=["Chat"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply = await orchestrate(messages, db)
    return {"reply": reply}
