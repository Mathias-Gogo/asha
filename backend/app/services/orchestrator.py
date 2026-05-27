from app.services.groq_service import groq
from app.agents.halo.workflow import halo_workflow
from app.agents.harold.workflow import harold_workflow
from app.services.report_service import report_service
from app.database import crud
from app.utils.logger import logger

SYSTEM_PROMPT = """You are Asha, an AI business advisor built by Mexuri to help founders. You help with business research and strategy particularly in the African market. You have data on all business sectors and know what works and what fails. You get to know more about the business before you conduct strategy and research. Be concise, sharp, and insightful.

About Mexuri:
- Mexuri is a tech company dedicated to integrating technology into all African sectors to provide more opportunity for Africans and better the standard of living.

When responding:
- If responding about who you are and who built you, respond simply, in a way a 16 year old would understand, but keep it fluent
- Use **bold** for key terms and important points
- Use bullet lists or numbered lists where appropriate
- Use tables for comparisons
- Use headings to structure long responses
- When the user asks for data that can be visualized, output a chart block like this:
```chart
{"type": "bar", "title": "Chart Title", "data": [{"name": "Label", "value": 100}]}
```
- For pie charts use: {"type": "pie", ...} with the same data structure"""

CLASSIFIER_PROMPT = """You are an intent classifier. Given the last user message, respond with EXACTLY one word:
- RESEARCH   → user wants to analyse/research a business (provides business name, niche, goal)
- STRATEGY   → user wants a growth strategy and already has a business_id or research done
- REPORT     → user wants to retrieve a full report for a business_id
- CHAT       → anything else (general questions, greetings, follow-ups)

Respond with only the single word. No punctuation."""


async def _classify(message: str) -> str:
    result = await groq.generate(message, system=CLASSIFIER_PROMPT, max_tokens=5)
    intent = result.strip().upper()
    if intent not in ("RESEARCH", "STRATEGY", "REPORT"):
        intent = "CHAT"
    logger.info(f"Orchestrator intent: {intent}")
    return intent


def _extract_business_data(messages: list[dict]) -> dict | None:
    """Pull business fields from the conversation if present."""
    text = " ".join(m.get("content", "") for m in messages).lower()
    # Require at minimum a business name signal
    if "business" not in text and "niche" not in text:
        return None
    # Best-effort extraction — the LLM will have asked for these in prior turns
    # Return None to fall back to CHAT if we can't find structured data
    return None


async def orchestrate(messages: list[dict], db) -> str:
    last_message = messages[-1]["content"] if messages else ""
    intent = await _classify(last_message)

    if intent == "RESEARCH":
        # Ask the LLM to extract structured business data from the conversation
        extract_prompt = f"""Extract business details from this conversation as JSON with keys:
business_name, niche, goal, instagram (optional), twitter (optional), website (optional).
If any required field (business_name, niche, goal) is missing, return {{"insufficient": true}}.
Conversation: {[m['content'] for m in messages]}
Respond with only the JSON object."""

        raw = await groq.generate(extract_prompt, max_tokens=300)

        from app.utils.cleaners import extract_json
        data = extract_json(raw)

        if not data or data.get("insufficient"):
            return await groq.chat(messages, system=SYSTEM_PROMPT)

        # Save business + run Halo
        business = crud.create_business(db, {
            "name":      data.get("business_name"),
            "niche":     data.get("niche"),
            "goal":      data.get("goal"),
            "instagram": data.get("instagram"),
            "twitter":   data.get("twitter"),
            "website":   data.get("website"),
        })

        research = await halo_workflow(data)
        if research.get("parse_error"):
            return "I ran into an issue analysing that business. Could you try rephrasing the details?"

        crud.create_research_report(db, business.id, research)

        # Format research into a readable reply
        summary_prompt = f"""Turn this research JSON into a clear, well-formatted markdown response for the user.
Be concise and insightful. Use headings, bullets, and bold text.
Research: {research}"""
        return await groq.generate(summary_prompt, system=SYSTEM_PROMPT)

    if intent == "STRATEGY":
        # Try to find the most recent business in DB for this session
        businesses = crud.get_all_businesses(db)
        if not businesses:
            return await groq.chat(messages, system=SYSTEM_PROMPT)

        business = businesses[-1]
        reports = crud.get_reports_for_business(db, business.id)
        if not reports:
            return "I need to run research first before building a strategy. Share your business details and I'll start."

        report = reports[-1]
        import json
        research = {
            "audience":        report.audience,
            "competitors":     json.loads(report.competitors or "[]"),
            "content_gaps":    json.loads(report.content_gaps or "[]"),
            "growth_problems": json.loads(report.growth_problems or "[]"),
            "market_trends":   json.loads(report.market_trends or "[]"),
        }
        business_data = {"business_name": business.name, "niche": business.niche, "goal": business.goal}

        strategy = await harold_workflow(business_data, research)
        if strategy.get("parse_error"):
            return "I had trouble generating the strategy. Please try again."

        crud.create_strategy(db, business.id, report.id, strategy)

        summary_prompt = f"""Turn this strategy JSON into a clear, well-formatted markdown response for the user.
Use headings, bullets, bold text. Be actionable and specific.
Strategy: {strategy}"""
        return await groq.generate(summary_prompt, system=SYSTEM_PROMPT)

    if intent == "REPORT":
        businesses = crud.get_all_businesses(db)
        if not businesses:
            return "No reports found yet. Share your business details and I'll run a full analysis."

        business = businesses[-1]
        full = report_service.get_full_report(db, business.id)
        if full.get("error"):
            return full["error"]

        summary_prompt = f"""Turn this full business report JSON into a clear, well-formatted markdown summary.
Include business info, research findings, strategy, and scores. Use headings and bullets.
Report: {full}"""
        return await groq.generate(summary_prompt, system=SYSTEM_PROMPT)

    # Default: plain conversational chat
    return await groq.chat(messages, system=SYSTEM_PROMPT)
