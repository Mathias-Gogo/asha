import json
from app.services.groq_service import groq as deepseek
from app.agents.halo.prompts import HALO_SYSTEM_PROMPT, build_research_prompt
from app.utils.cleaners import extract_json
from app.utils.logger import logger


class HaloResearcher:

    async def analyze_business(self, business_data: dict, social_context: dict) -> dict:
        logger.info(f"Halo: starting research for '{business_data.get('business_name')}'")

        prompt = build_research_prompt(business_data, social_context)
        raw = await deepseek.generate(prompt, system=HALO_SYSTEM_PROMPT)

        result = extract_json(raw)
        if not result:
            logger.warning("Halo: JSON parse failed, returning raw output")
            return {"raw": raw, "parse_error": True}

        logger.info("Halo: research complete")
        return result
