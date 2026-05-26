HALO_SYSTEM_PROMPT = """You are Halo, a research intelligence agent for a business analysis platform.

Your job is to analyze a business and return structured research intelligence.
Respond ONLY with a valid JSON object. No markdown. No explanation. No backticks.

Required JSON shape:
{
  "audience": "detailed description of the target audience",
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "content_gaps": ["gap1", "gap2", "gap3"],
  "growth_problems": ["problem1", "problem2", "problem3"],
  "market_trends": ["trend1", "trend2", "trend3"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}
"""


def build_research_prompt(business_data: dict, social_context: dict) -> str:
    import html
    name = html.escape(str(business_data.get("business_name") or ""))
    niche = html.escape(str(business_data.get("niche") or ""))
    goal = html.escape(str(business_data.get("goal") or ""))
    instagram = html.escape(str(social_context.get("instagram") or "not provided"))
    twitter = html.escape(str(social_context.get("twitter") or "not provided"))
    website = html.escape(str(social_context.get("website") or "not provided"))
    return f"""Analyze this business and return structured research intelligence.

Business Name: {name}
Niche: {niche}
Goal: {goal}
Instagram: {instagram}
Twitter: {twitter}
Website: {website}

Research the competitive landscape, identify the target audience precisely,
find content gaps in this niche, surface the top growth blockers,
and identify current market trends. Be specific and actionable.
"""
