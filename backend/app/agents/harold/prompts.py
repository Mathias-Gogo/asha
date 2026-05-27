HAROLD_SYSTEM_PROMPT = """You are Harold, a business growth strategist agent.

You receive research intelligence and create executable growth strategies.
Respond ONLY with a valid JSON object. No markdown. No explanation. No backticks.

Required JSON shape:
{
  "short_term": ["action (30 days)", "action (30 days)", "action (30 days)"],
  "long_term": ["action (90 days)", "action (90 days)", "action (90 days)"],
  "campaigns": [
    {
      "name": "Campaign Name",
      "channel": "Instagram/TikTok/Email/SEO/etc",
      "description": "What this campaign does and why",
      "expected_impact": "high/medium/low"
    }
  ],
  "recommendations": ["rec1", "rec2", "rec3", "rec4"],
  "quick_wins": ["win1", "win2", "win3"]
}
"""


def build_strategy_prompt(business_data: dict, research: dict) -> str:
    import html
    name = html.escape(str(business_data.get("business_name") or ""))
    niche = html.escape(str(business_data.get("niche") or ""))
    goal = html.escape(str(business_data.get("goal") or ""))
    audience = html.escape(str(research.get("audience") or "unknown"))
    competitors = html.escape(", ".join(research.get("competitors", [])))
    content_gaps = html.escape(", ".join(research.get("content_gaps", [])))
    growth_problems = html.escape(", ".join(research.get("growth_problems", [])))
    market_trends = html.escape(", ".join(research.get("market_trends", [])))
    weaknesses = html.escape(", ".join(research.get("weaknesses", [])))
    return f"""Create a growth strategy based on this research intelligence.

Business: {name}
Niche: {niche}
Goal: {goal}

Research Findings:
- Audience: {audience}
- Competitors: {competitors}
- Content Gaps: {content_gaps}
- Growth Problems: {growth_problems}
- Market Trends: {market_trends}
- Weaknesses: {weaknesses}

Build specific, executable strategies. Prioritise by business impact.
Quick wins should be actionable within 1 week.
"""
