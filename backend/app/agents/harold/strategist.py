from app.services.groq_service import groq as deepseek
from app.agents.harold.prompts import HAROLD_SYSTEM_PROMPT, build_strategy_prompt
from app.utils.cleaners import extract_json
from app.utils.logger import logger


class HaroldStrategist:

    async def create_strategy(self, business_data: dict, research: dict) -> dict:
        logger.info(f"Harold: building strategy for '{business_data.get('business_name')}'")

        prompt = build_strategy_prompt(business_data, research)
        raw = await deepseek.generate(prompt, system=HAROLD_SYSTEM_PROMPT)

        result = extract_json(raw)
        if not result:
            logger.warning("Harold: JSON parse failed, returning raw output")
            return {"raw": raw, "parse_error": True}

        logger.info("Harold: strategy complete")
        return result
