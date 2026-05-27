```markdown
# Asha AI — Backend Integration Update

## Overview

This update integrates a structured AI business intelligence backend into the existing React/Vite frontend. The system transitions from a simple chat-based UI to a **research + strategy pipeline architecture** powered by FastAPI.

The goal is to enable Asha to function as an **AI business advisor**, not just a chatbot.

---

## What Changed

### 1. Backend Added (FastAPI)

A new backend was introduced inside:

```

/backend

```

It implements a structured AI pipeline:

- Business research (Halo agent)
- Strategy generation (Harold agent)
- Scoring and validation layer
- Report assembly system

---

### 2. Core API Endpoints

The backend exposes the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/business/create` | Create and store a business |
| POST | `/research/run` | Run AI research pipeline (Halo) |
| GET  | `/research/{id}` | Fetch research results |
| POST | `/strategy/generate` | Generate strategy (Harold) |
| GET  | `/reports/{business_id}` | Get full combined report |

---

### 3. AI Pipeline Architecture

The backend is structured as a multi-agent system:

```

FastAPI
↓
Routes (thin layer)
↓
Agents
├── Halo (Research Engine)
├── Harold (Strategy Engine)
↓
Services
├── DeepSeek API service
├── Scoring/validation layer
↓
Database (SQLAlchemy)

```

Key rule:
- AI model calls are NOT made in routes
- All intelligence flows through agents

---

### 4. Frontend Role Clarification

The frontend (React + Vite) remains responsible for:

- Chat UI / user interaction
- Sending business inputs
- Rendering structured AI responses
- Displaying reports (cards, tables, charts)

It no longer handles:
- Business logic
- AI orchestration
- Prompt engineering

---

### 5. New Data Flow

#### Before
```

Frontend → AI model → Response

```

#### Now
```

Frontend → FastAPI → Halo (research)
↓
Harold (strategy)
↓
Scoring layer
↓
Final report → Frontend

```

---

### 6. Key Improvements

- Structured business intelligence instead of raw chat responses
- Multi-agent system for separation of concerns
- Scoring system for validating strategies
- Modular services for AI calls and logic
- Scalable architecture for future expansion

---

### 7. System Rules

- Routes remain thin (no AI logic inside routes)
- All AI calls go through `services/deepseek_service.py`
- Agents handle reasoning pipelines
- Scoring layer validates outputs before final response

---

### 8. Frontend Integration Changes

Frontend should now call backend endpoints directly:

Example flow:

1. Create business
2. Run research
3. Generate strategy
4. Fetch full report

Backend replaces direct AI calls from frontend.

---

### 9. Current Limitations (MVP Stage)

- No persistent memory across chat sessions yet
- No async job queue (Celery/Redis planned later)
- No real-time streaming responses yet
- Single-provider LLM integration (DeepSeek only)

---

### 10. Next Planned Upgrades

- Redis + Celery for background processing
- PostgreSQL migration
- Playwright-based market scraping
- LangGraph multi-agent orchestration
- Streaming responses (WebSockets or SSE)
- Authentication system (users, sessions)

---

## Summary

This update converts Asha from a simple chat interface into a **structured AI business intelligence system** with:

- Research agent (Halo)
- Strategy agent (Harold)
- Validation/scoring layer
- Report generation engine

The frontend now acts purely as a presentation layer for backend-generated intelligence.
```
